import Head from "next/head";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import { withAuth } from "@components/templates/withAuth";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ScanLine,
  ShieldAlert,
  Ticket,
  Wifi,
} from "lucide-react";
import { staffGateApi } from "@features/staffGate/staffGateApi";
import type {
  GateResponse,
  GateScanLogResponse,
  GateScanResponse,
} from "@features/staffGate/staffGateTypes";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";

type TapMode = "TAP-IN" | "TAP-OUT";

type StationResponse = {
  stationId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
};

type ValidationResult = {
  status: string;
  title: string;
  subtitle: string;
  message: string;
  detail?: string;
  tone: "green" | "red" | "amber";
};

const STAFF_SCAN_STORAGE_KEYS = {
  station: "metro-staff-scan-station",
  gate: "metro-staff-scan-gate",
  mode: "metro-staff-scan-mode",
} as const;

const DUPLICATE_SCAN_COOLDOWN_MS = 3000;

function gateDirection(gate: GateResponse) {
  return gate.directionMode || gate.action;
}

function matchesMode(action: string | undefined, mode: TapMode) {
  if (!action) return false;
  const normalized = action.toUpperCase().replace(/[_\s]/g, "-");
  if (
    normalized === "BI" ||
    normalized === "BOTH" ||
    normalized === "BIDIRECTIONAL" ||
    normalized === "BI-DIRECTIONAL"
  ) {
    return true;
  }

  return mode === "TAP-IN"
    ? normalized === "IN" ||
        normalized === "TAP-IN" ||
        normalized === "CHECK-IN" ||
        normalized === "ENTRY" ||
        normalized === "ENTRY-ONLY" ||
        normalized === "ENTRANCE" ||
        normalized === "ENTER"
    : normalized === "OUT" ||
        normalized === "TAP-OUT" ||
        normalized === "CHECK-OUT" ||
        normalized === "EXIT" ||
        normalized === "EXIT-ONLY" ||
        normalized === "LEAVE";
}

function pickGateForMode(
  gates: GateResponse[],
  stationId: string,
  mode: TapMode,
) {
  return (
    gates.find(
      (item) =>
        item.stationId === stationId && matchesMode(gateDirection(item), mode),
    ) ??
    gates.find((item) => item.stationId === stationId) ??
    gates.find((item) => matchesMode(gateDirection(item), mode)) ??
    gates[0]
  );
}

function scanContent(raw: string) {
  const value = raw.trim();
  if (!value) return "";

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object") {
      const item = parsed as Record<string, unknown>;
      const token =
        item.qrContent ?? item.qrToken ?? item.token ?? item.content;
      if (token !== undefined && token !== null) return String(token).trim();
    }
  } catch {
    // QR content may be a plain token.
  }

  try {
    const url = new URL(value);
    const token =
      url.searchParams.get("qrContent") ??
      url.searchParams.get("qrToken") ??
      url.searchParams.get("token") ??
      url.searchParams.get("content");
    if (token) return token.trim();
  } catch {
    // QR content may not be a URL.
  }

  return value;
}

function scanErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const item = data as Record<string, unknown>;
      const message = item.message ?? item.error;
      if (message) return String(message);
    }
    return error.message;
  }

  return error instanceof Error
    ? error.message
    : "Không thể gọi API /staff/gates/scan";
}

function humanizeScanMessage(raw?: string) {
  const message = raw?.trim();
  if (!message) {
    return {
      message: "Không nhận được phản hồi chi tiết từ hệ thống.",
      detail: "Vui lòng quét lại hoặc kiểm tra kết nối với máy chủ.",
    };
  }

  const normalized = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    normalized.includes("getusermedia") ||
    normalized.includes("mediadevices") ||
    normalized.includes("secure context") ||
    normalized.includes("notallowederror") ||
    normalized.includes("permission denied")
  ) {
    return {
      message: "KhÃ´ng thá»ƒ má»Ÿ camera trÃªn trÃ¬nh duyá»‡t hiá»‡n táº¡i.",
      detail:
        "Camera chá»‰ hoáº¡t Ä‘á»™ng trÃªn HTTPS hoáº·c localhost. HÃ£y kiá»ƒm tra domain deploy, quyá»n camera vÃ  thá»­ láº¡i.",
    };
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("expire") ||
    normalized.includes("het han")
  ) {
    return {
      message: "Mã QR đã hết hạn.",
      detail: "Yêu cầu hành khách mở lại vé để tạo mã QR mới.",
    };
  }

  if (
    normalized.includes("already used") ||
    normalized.includes("already scanned") ||
    normalized.includes("used before") ||
    normalized.includes("da su dung")
  ) {
    return {
      message: "Mã vé này đã được sử dụng trước đó.",
      detail: "Kiểm tra lại lịch sử quét hoặc xác nhận với hành khách.",
    };
  }

  if (
    normalized.includes("invalid qr") ||
    normalized.includes("invalid token") ||
    normalized.includes("malformed") ||
    normalized.includes("khong hop le")
  ) {
    return {
      message: "Mã QR không hợp lệ hoặc không đọc được.",
      detail: "Hãy thử quét lại hoặc nhập đúng nội dung mã.",
    };
  }

  if (
    normalized.includes("wrong station") ||
    normalized.includes("station mismatch") ||
    normalized.includes("khac ga")
  ) {
    return {
      message: "Vé không hợp lệ tại ga hiện tại.",
      detail: "Kiểm tra lại ga đã chọn hoặc yêu cầu hành khách dùng đúng ga.",
    };
  }

  if (
    normalized.includes("wrong gate") ||
    normalized.includes("gate mismatch") ||
    normalized.includes("khac cong")
  ) {
    return {
      message: "Vé không hợp lệ tại cổng này.",
      detail:
        "Kiểm tra lại cổng đang chọn hoặc hướng dẫn hành khách sang cổng đúng.",
    };
  }

  if (
    normalized.includes("tap-out before tap-in") ||
    normalized.includes("invalid direction") ||
    normalized.includes("wrong direction") ||
    normalized.includes("chieu quet")
  ) {
    return {
      message: "Không đúng chiều quét vé.",
      detail:
        "Kiểm tra nhân viên đang chọn Vào ga hay Ra ga trước khi quét lại.",
    };
  }

  if (
    normalized.includes("not found") ||
    normalized.includes("ticket not found") ||
    normalized.includes("khong tim thay")
  ) {
    return {
      message: "Không tìm thấy vé hoặc mã QR trong hệ thống.",
      detail: "Yêu cầu hành khách kiểm tra lại vé hoặc tạo lại mã QR.",
    };
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("network error") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("connection") ||
    normalized.includes("econn") ||
    normalized.includes("api")
  ) {
    return {
      message: "Không kết nối được máy chủ kiểm soát vé.",
      detail: "Kiểm tra mạng hoặc thử quét lại sau ít giây.",
    };
  }

  return {
    message,
    detail:
      "Nếu lỗi lặp lại, vui lòng kiểm tra log quét và trạng thái hệ thống.",
  };
}

function getCameraSupportError() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "TrÃ¬nh duyá»‡t chÆ°a sáºµn sÃ ng Ä‘á»ƒ má»Ÿ camera.";
  }

  if (!window.isSecureContext) {
    return "Camera chá»‰ hoáº¡t Ä‘á»™ng khi website cháº¡y HTTPS hoáº·c localhost.";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£ camera hoáº·c camera API Ä‘ang bá»‹ cháº·n.";
  }

  return null;
}

function normalizeValidationResult(
  result: GateScanResponse,
  mode: TapMode,
): ValidationResult {
  const statusRaw = String(result.result ?? "").toUpperCase();
  const ok = ["ALLOW", "SUCCESS", "ACCEPTED"].includes(statusRaw);
  const messageInfo = humanizeScanMessage(
    result.message || (ok ? "ALLOW" : "DENY"),
  );

  if (ok) {
    return {
      status: "ALLOW",
      title: "Qua cổng thành công",
      subtitle:
        mode === "TAP-IN"
          ? "Hành khách được phép vào ga"
          : "Hành khách được phép ra ga",
      message:
        messageInfo.message === "ALLOW"
          ? "Vé hợp lệ và cổng có thể mở."
          : messageInfo.message,
      detail:
        messageInfo.message === "ALLOW"
          ? "Mời hành khách di chuyển qua cổng."
          : messageInfo.detail,
      tone: "green",
    };
  }

  return {
    status: "INVALID",
    title: "Từ chối qua cổng",
    subtitle: "Giao dịch không được chấp nhận",
    message: messageInfo.message,
    detail: messageInfo.detail,
    tone: "red",
  };
}

function formatScanTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("vi-VN", { hour12: false });
}

function formatTodayVi() {
  const now = new Date();
  const weekday = now.toLocaleDateString("vi-VN", { weekday: "long" });
  const day = now.toLocaleDateString("vi-VN", { day: "2-digit" });
  const month = now.toLocaleDateString("vi-VN", { month: "long" });
  const year = now.toLocaleDateString("vi-VN", { year: "numeric" });

  const titleWeekday = weekday.replace(/^\p{L}/u, (m) => m.toUpperCase());
  return `${titleWeekday}, ${day} ${month} ${year}`;
}

function playBeepTone(
  context: AudioContext,
  frequency: number,
  durationMs: number,
  type: OscillatorType = "sine",
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000);
}

function StaffScanPage() {
  const [stations, setStations] = useState<StationResponse[]>([]);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [station, setStation] = useState("");
  const [gate, setGate] = useState("");
  const [filterLoading, setFilterLoading] = useState(true);
  const [gateLoading, setGateLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<TapMode>("TAP-IN");
  const [log, setLog] = useState<GateScanLogResponse[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<GateScanResponse | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [shiftPassCount, setShiftPassCount] = useState(0);
  const [shiftFailCount, setShiftFailCount] = useState(0);
  const [lastValidation, setLastValidation] = useState<ValidationResult>({
    status: "SUCCESS",
    title: "Sẵn sàng",
    subtitle: "Chọn ga, cổng và quét vé",
    message: "",
    detail: "Chọn ga, cổng và chế độ quét để bắt đầu làm việc.",
    tone: "green",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const scannerReaderRef = useRef<unknown | null>(null);
  const lastScanSignatureRef = useRef<{
    value: string;
    timestamp: number;
  } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const shouldResumeCameraRef = useRef(false);

  const todayLabel = useMemo(() => formatTodayVi(), []);
  const availableGates = useMemo(() => {
    const byStationAndMode = gates.filter(
      (item) =>
        (!station || item.stationId === station) &&
        matchesMode(gateDirection(item), mode),
    );
    if (byStationAndMode.length > 0) return byStationAndMode;

    const byStation = gates.filter(
      (item) => !station || item.stationId === station,
    );
    if (byStation.length > 0) return byStation;

    const byMode = gates.filter((item) =>
      matchesMode(gateDirection(item), mode),
    );
    return byMode.length > 0 ? byMode : gates;
  }, [gates, mode, station]);
  const resultStationLabel =
    stations.find((item) => item.stationId === lastScan?.stationId)?.name ??
    lastScan?.stationId ??
    "-";
  const resultGateLabel =
    gates.find((item) => item.gateId === lastScan?.gateId)?.gateCode ??
    lastScan?.gateId ??
    "-";
  const normalizedToken = useMemo(() => scanContent(token), [token]);
  const scanBlockedReason = useMemo(() => {
    if (filterLoading) return "Đang tải danh sách ga và cổng.";
    if (!station) return "Chưa chọn ga để quét vé.";
    if (!gate) return "Chưa chọn cổng quét phù hợp.";
    if (isScanning) return "Hệ thống đang xử lý lượt quét hiện tại.";
    return "";
  }, [filterLoading, gate, isScanning, station]);
  const canSubmitScan = !scanBlockedReason;
  const shiftTotalCount = shiftPassCount + shiftFailCount;
  const currentStationName =
    stations.find((item) => item.stationId === station)?.name ?? "Chưa chọn ga";
  const currentGateName =
    gates.find((item) => item.gateId === gate)?.gateCode ?? "Chưa chọn cổng";
  const modeLabel = mode === "TAP-IN" ? "Vào ga" : "Ra ga";
  const toneStyles =
    lastValidation.tone === "green"
      ? {
          shell:
            "border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.08),_transparent_18%),linear-gradient(180deg,#ffffff_0%,#fcfffd_100%)]",
          badge: "bg-emerald-100 text-emerald-700",
          accent: "text-emerald-600",
          panel: "border-emerald-200 bg-emerald-50/70",
          rail: "bg-emerald-500",
          heroIcon: (
            <CheckCircle2
              className="h-14 w-14 text-emerald-600"
              aria-hidden="true"
            />
          ),
          chipIcon: (
            <CheckCircle2
              className="h-4 w-4 text-emerald-600"
              aria-hidden="true"
            />
          ),
        }
      : lastValidation.tone === "amber"
        ? {
            shell:
              "border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.10),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.08),_transparent_18%),linear-gradient(180deg,#ffffff_0%,#fffdf8_100%)]",
            badge: "bg-amber-100 text-amber-700",
            accent: "text-amber-600",
            panel: "border-amber-200 bg-amber-50/80",
            rail: "bg-amber-500",
            heroIcon: (
              <AlertTriangle
                className="h-14 w-14 text-amber-600"
                aria-hidden="true"
              />
            ),
            chipIcon: (
              <AlertTriangle
                className="h-4 w-4 text-amber-600"
                aria-hidden="true"
              />
            ),
          }
        : {
            shell:
              "border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.10),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.08),_transparent_18%),linear-gradient(180deg,#ffffff_0%,#fffafb_100%)]",
            badge: "bg-rose-100 text-rose-700",
            accent: "text-rose-600",
            panel: "border-rose-200 bg-rose-50/80",
            rail: "bg-rose-500",
            heroIcon: (
              <XCircle className="h-14 w-14 text-rose-600" aria-hidden="true" />
            ),
            chipIcon: (
              <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
            ),
          };

  const playFeedback = useCallback((tone: "success" | "error" | "warning") => {
    if (typeof window === "undefined") return;

    if ("vibrate" in navigator) {
      if (tone === "success") navigator.vibrate([70, 40, 90]);
      else if (tone === "warning") navigator.vibrate(120);
      else navigator.vibrate([140, 50, 140]);
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      const audioContext = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      if (tone === "success") {
        playBeepTone(audioContext, 880, 120, "sine");
        window.setTimeout(
          () => playBeepTone(audioContext, 1175, 140, "sine"),
          90,
        );
      } else if (tone === "warning") {
        playBeepTone(audioContext, 640, 160, "triangle");
      } else {
        playBeepTone(audioContext, 280, 180, "sawtooth");
        window.setTimeout(
          () => playBeepTone(audioContext, 220, 220, "sawtooth"),
          120,
        );
      }
    } catch {
      // Ignore audio failures to avoid blocking scan flow.
    }
  }, []);

  const refreshGates = useCallback(async () => {
    if (gateLoading) return;

    setGateLoading(true);
    try {
      const gateItems = await staffGateApi.getGates();
      setGates(gateItems);
      setGate((currentGate) => {
        if (
          currentGate &&
          gateItems.some((item) => item.gateId === currentGate)
        ) {
          return currentGate;
        }

        return pickGateForMode(gateItems, station, mode)?.gateId ?? "";
      });
      setFilterError(null);
    } catch {
      setFilterError("Không thể tải danh sách cổng.");
    } finally {
      setGateLoading(false);
    }
  }, [gateLoading, mode, station]);

  const loadLogs = useCallback(async () => {
    if (!station || !gate) {
      setLog([]);
      return;
    }

    setLogLoading(true);
    try {
      const data = await staffGateApi.getLogs({
        stationId: station,
        gateId: gate,
      });
      const latest = [...data]
        .sort((left, right) =>
          (right.scannedAt ?? "").localeCompare(left.scannedAt ?? ""),
        )
        .slice(0, 10);
      setLog(latest);
      setLogError(null);
    } catch {
      setLog([]);
      setLogError("Không thể tải lịch sử quét gần đây.");
    } finally {
      setLogLoading(false);
    }
  }, [gate, station]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiClient.get(API_ENDPOINTS.stations.base),
      staffGateApi.getGates(),
    ])
      .then(([stationResponse, gateItems]) => {
        if (cancelled) return;
        const stationData = unwrapApiResponse<StationResponse[]>(
          stationResponse.data,
        );
        const stationItems = Array.isArray(stationData) ? stationData : [];
        setStations(stationItems);
        setGates(gateItems);
        const initialStationId = stationItems[0]?.stationId || "";
        setStation((current) => current || initialStationId);
        setGate((current) => {
          const selectedStation = initialStationId;
          const currentGate = gateItems.find((item) => item.gateId === current);
          if (
            currentGate &&
            (!selectedStation || currentGate.stationId === selectedStation) &&
            matchesMode(gateDirection(currentGate), "TAP-IN")
          ) {
            return current;
          }

          return pickGateForMode(gateItems, selectedStation, "TAP-IN")?.gateId || "";
        });
        setFilterError(null);
      })
      .catch(() => {
        if (!cancelled) setFilterError("Không thể tải danh sách ga và cổng.");
      })
      .finally(() => {
        if (!cancelled) setFilterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedStation = window.localStorage.getItem(
      STAFF_SCAN_STORAGE_KEYS.station,
    );
    const savedGate = window.localStorage.getItem(STAFF_SCAN_STORAGE_KEYS.gate);
    const savedMode = window.localStorage.getItem(STAFF_SCAN_STORAGE_KEYS.mode);

    if (savedStation) setStation((current) => current || savedStation);
    if (savedGate) setGate((current) => current || savedGate);
    if (savedMode === "TAP-IN" || savedMode === "TAP-OUT") {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !station) return;
    window.localStorage.setItem(STAFF_SCAN_STORAGE_KEYS.station, station);
  }, [station]);

  useEffect(() => {
    if (typeof window === "undefined" || !gate) return;
    window.localStorage.setItem(STAFF_SCAN_STORAGE_KEYS.gate, gate);
  }, [gate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STAFF_SCAN_STORAGE_KEYS.mode, mode);
  }, [mode]);

  const runScan = async (rawToken: string) => {
    if (!station || !gate) {
      setLastValidation({
        status: "INVALID",
        title: "Thiếu thông tin quét",
        subtitle: "Chưa chọn ga hoặc cổng",
        message: "Vui lòng chọn ga và cổng trước khi quét.",
        detail:
          "Sau khi chọn xong, nhân viên có thể dùng camera hoặc dán nội dung QR vào ô nhập.",
        tone: "amber",
      });
      playFeedback("warning");
      return;
    }

    const trimmed = scanContent(rawToken);

    if (!trimmed) {
      setLastScan(null);
      setLastValidation({
        status: "INVALID",
        title: "Không đọc được mã QR",
        subtitle: "Dữ liệu quét chưa hợp lệ",
        message: "Thiếu dữ liệu mã QR hoặc nội dung bị trống.",
        detail:
          "Hãy quét lại mã QR hoặc kiểm tra nội dung được dán vào ô nhập.",
        tone: "red",
      });
      playFeedback("error");
      return;
    }

    const scanSignature = `${station}::${gate}::${mode}::${trimmed}`;
    const now = Date.now();
    if (
      lastScanSignatureRef.current &&
      lastScanSignatureRef.current.value === scanSignature &&
      now - lastScanSignatureRef.current.timestamp < DUPLICATE_SCAN_COOLDOWN_MS
    ) {
      setLastValidation({
        status: "DUPLICATE",
        title: "Quét quá nhanh",
        subtitle: "Vé này vừa được xử lý cách đây vài giây",
        message: "Hệ thống đang chặn quét trùng để tránh xử lý lặp.",
        detail:
          "Vui lòng chờ khoảng 3 giây rồi quét lại nếu thực sự cần kiểm tra lại vé.",
        tone: "amber",
      });
      playFeedback("warning");
      return;
    }

    setIsScanning(true);
    try {
      const selectedGate = gates.find((item) => item.gateId === gate);
      const result = await staffGateApi.scan({
        qrContent: trimmed,
        deviceId: selectedGate?.deviceId || selectedGate?.deviceCode || gate,
        stationId: station,
        gateId: gate,
        action: mode === "TAP-IN" ? "TAP_IN" : "TAP_OUT",
      });

      lastScanSignatureRef.current = { value: scanSignature, timestamp: now };
      setLastScan(result);
      const validation = normalizeValidationResult(result, mode);
      setLastValidation(validation);
      if (validation.tone === "green") {
        setShiftPassCount((current) => current + 1);
      } else if (validation.tone === "red") {
        setShiftFailCount((current) => current + 1);
      }
      playFeedback(validation.tone === "green" ? "success" : "error");
      if (validation.tone === "green") {
        window.setTimeout(() => {
          setToken("");
        }, 900);
      }
      await loadLogs();
    } catch (err) {
      const messageInfo = humanizeScanMessage(scanErrorMessage(err));
      setLastScan(null);
      setLastValidation({
        status: "INVALID",
        title: "Không thể xử lý lượt quét",
        subtitle: "Hệ thống chưa hoàn tất kiểm tra vé",
        message: messageInfo.message,
        detail: messageInfo.detail,
        tone: "red",
      });
      setShiftFailCount((current) => current + 1);
      playFeedback("error");
    } finally {
      setIsScanning(false);
      if (shouldResumeCameraRef.current) {
        shouldResumeCameraRef.current = false;
        window.setTimeout(() => {
          setIsCameraOn(true);
        }, 900);
      } else {
        shouldResumeCameraRef.current = false;
      }
    }
  };

  const stopCamera = () => {
    try {
      scannerControlsRef.current?.stop();
    } finally {
      shouldResumeCameraRef.current = false;
      scannerControlsRef.current = null;
      scannerReaderRef.current = null;

      const videoEl = videoRef.current;
      const stream = videoEl?.srcObject;
      if (stream && typeof stream === "object" && "getTracks" in stream) {
        try {
          (stream as MediaStream).getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        }
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
      setIsCameraOn(false);
      setIsCameraStarting(false);
    }
  };

  const handleScanAction = () => {
    if (scanBlockedReason) {
      playFeedback("warning");
      return;
    }

    if (normalizedToken) {
      void runScan(token);
      return;
    }

    setCameraError(null);
    setIsCameraOn(true);
  };

  const handleEmergencyStop = () => {
    stopCamera();
    setCameraError(null);
    setLastValidation({
      status: "STOPPED",
      title: "Đã dừng camera",
      subtitle: "Quét vé đang tạm dừng",
      message: "Camera đã được tắt bằng nút tạm dừng.",
      detail: "Bấm Quét vé để mở lại camera khi sẵn sàng tiếp tục.",
      tone: "amber",
    });
    playFeedback("warning");
  };

  useEffect(() => {
    if (!isCameraOn) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      setCameraError(null);
      setIsCameraStarting(true);

      try {
        const videoEl = videoRef.current;
        if (!videoEl) {
          throw new Error("Không tìm thấy phần tử video");
        }

        const cameraSupportError = getCameraSupportError();
        if (cameraSupportError) {
          throw new Error(cameraSupportError);
        }

        const mod = await import("@zxing/browser");
        if (cancelled) return;

        const reader = new mod.BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 200,
        });
        scannerReaderRef.current = reader;

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: { ideal: "environment" } },
          },
          videoEl,
          (result, error, controlsFromCb) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              shouldResumeCameraRef.current = true;
              setToken(text);
              runScan(text);
              (controlsFromCb ?? controls).stop();
              setIsCameraOn(false);
              setIsCameraStarting(false);
            }
            if (error) {
              // ignore decode errors until a result is found
            }
          },
        );

        scannerControlsRef.current = controls;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể mở camera";
        setCameraError(humanizeScanMessage(message).message);
        setIsCameraOn(false);
      } finally {
        if (!cancelled) setIsCameraStarting(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);

  return (
    <>
      <Head>
        <title>Quét vé | Metro</title>
      </Head>
      <StaffLayout wide>
        <div className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),_transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#cbd5e1_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
          <div className="relative z-10">
            <div className="mb-6">
              <nav className="text-xs text-gray-400 mb-1">
                <span>Nhân viên ga</span>
                <span className="mx-1">›</span>
                <span className="text-blue-600 font-medium">Quét vé</span>
              </nav>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">
                  Quét vé - Điều khiển cổng
                </h1>
                <p className="text-sm text-slate-500">{todayLabel}</p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Terminal
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {currentGateName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {currentStationName}
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${toneStyles.badge}`}
                  >
                    {lastValidation.tone === "green"
                      ? "READY"
                      : lastValidation.tone === "amber"
                        ? "PENDING"
                        : "REJECTED"}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <Wifi
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                  Ca hiện tại đang hoạt động • {todayLabel}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Tổng lượt trong ca
                </div>
                <div className="mt-3 text-3xl font-black leading-none text-slate-900">
                  {shiftTotalCount}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Tính từ lúc mở màn hình quét
                </div>
              </div>

              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Pass
                </div>
                <div className="mt-3 text-3xl font-black leading-none text-emerald-700">
                  {shiftPassCount}
                </div>
                <div className="mt-1 text-sm text-emerald-700/80">
                  Số lượt quét thành công
                </div>
              </div>

              <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">
                  Fail
                </div>
                <div className="mt-3 text-3xl font-black leading-none text-rose-700">
                  {shiftFailCount}
                </div>
                <div className="mt-1 text-sm text-rose-700/80">
                  Số lượt bị từ chối hoặc lỗi
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <section className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Chọn ga
                    </span>
                    <div className="relative">
                      <select
                        value={station}
                        onChange={(e) => {
                          const stationId = e.target.value;
                          setStation(stationId);
                          setGate(
                            pickGateForMode(gates, stationId, mode)?.gateId ??
                              "",
                          );
                        }}
                        disabled={filterLoading}
                        className="h-9 w-full appearance-none rounded-lg bg-slate-50 px-3 pr-8 text-xs font-medium leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                      >
                        {stations.length === 0 && (
                          <option value="">Không có ga</option>
                        )}
                        {stations.map((s) => (
                          <option key={s.stationId} value={s.stationId}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                        <span
                          className="absolute left-[6.3px] top-[8.4px] h-1 w-2 border-b-2 border-r-2 border-gray-500"
                          style={{ transform: "rotate(45deg)" }}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </label>

                  <label className="space-y-1.5">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Cổng (Gate ID)
                    </span>
                    <div className="relative">
                      <select
                        value={gate}
                        onChange={(e) => {
                          const gateId = e.target.value;
                          setGate(gateId);
                          const selectedGate = gates.find(
                            (item) => item.gateId === gateId,
                          );
                          if (selectedGate?.stationId) {
                            setStation(selectedGate.stationId);
                          }
                        }}
                        onFocus={() => {
                          void refreshGates();
                        }}
                        disabled={filterLoading || !station}
                        className="h-9 w-full appearance-none rounded-lg bg-slate-50 px-3 pr-8 text-xs font-medium leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                      >
                        {gateLoading && (
                          <option value={gate}>Đang tải cổng...</option>
                        )}
                        {availableGates.length === 0 && (
                          <option value="">Không có cổng</option>
                        )}
                        {availableGates.map((g) => (
                          <option key={g.gateId} value={g.gateId}>
                            {g.gateCode}
                            {g.name ? ` - ${g.name}` : ""}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                        <span
                          className="absolute left-[6.3px] top-[8.4px] h-1 w-2 border-b-2 border-r-2 border-gray-500"
                          style={{ transform: "rotate(45deg)" }}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </label>
                </div>

                {filterError ? (
                  <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                    {filterError}
                  </div>
                ) : null}

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Dữ liệu mã QR
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                        scanBlockedReason
                          ? "bg-amber-100 text-amber-700"
                          : isCameraStarting
                            ? "bg-blue-100 text-blue-700"
                            : isCameraOn
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Ticket className="h-3 w-3" aria-hidden="true" />
                      {scanBlockedReason
                        ? "Cần chọn"
                        : isCameraStarting
                          ? "Đang mở"
                          : isCameraOn
                            ? "Đang quét"
                            : "Sẵn sàng"}
                    </span>
                  </div>
                  <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Nhập chuỗi token QR tại đây để giả lập quét..."
                    className="min-h-[88px] w-full resize-none rounded-xl bg-slate-50 px-3 py-3 font-mono text-xs leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 placeholder:text-gray-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setToken("")}
                      disabled={!token}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {cameraError ? (
                  <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                    {cameraError}
                  </div>
                ) : null}

                {isCameraOn || isCameraStarting ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                    <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                      <span>Khung camera</span>
                      <span>
                        {isCameraStarting ? "Đang mở" : "Đưa QR vào khung"}
                      </span>
                    </div>
                    <div className="relative h-36 bg-slate-900">
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-24 w-24 rounded-xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="pointer-events-none absolute h-px w-px opacity-0"
                    muted
                    playsInline
                  />
                )}

                <div className="mt-3">
                  <button
                    type="button"
                    disabled={!canSubmitScan}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold leading-6 text-white shadow-[0_12px_24px_-12px_rgba(37,99,235,0.9)] disabled:cursor-not-allowed disabled:bg-slate-300"
                    onClick={handleScanAction}
                  >
                    {isScanning ? (
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ScanLine className="h-5 w-5" aria-hidden="true" />
                    )}
                    {isScanning
                      ? "ĐANG QUÉT..."
                      : isCameraOn || isCameraStarting
                        ? "ĐANG MỞ CAMERA..."
                        : "QUÉT VÉ"}
                  </button>
                </div>

                {scanBlockedReason ? (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 outline outline-1 outline-offset-[-1px] outline-amber-200">
                    {scanBlockedReason}
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("TAP-IN");
                      setGate(
                        pickGateForMode(gates, station, "TAP-IN")?.gateId ?? "",
                      );
                    }}
                    className={`rounded-xl border px-3 py-3 text-center transition ${
                      mode === "TAP-IN"
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                      <ScanLine
                        className={`h-4 w-4 ${mode === "TAP-IN" ? "text-blue-600" : "text-slate-500"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-xs font-bold">Vào ga</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("TAP-OUT");
                      setGate(
                        pickGateForMode(gates, station, "TAP-OUT")?.gateId ??
                          "",
                      );
                    }}
                    className={`rounded-xl border px-3 py-3 text-center transition ${
                      mode === "TAP-OUT"
                        ? "border-slate-700 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                      <ShieldAlert
                        className={`h-4 w-4 ${mode === "TAP-OUT" ? "text-slate-900" : "text-slate-500"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-xs font-bold">Ra ga</div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleEmergencyStop}
                  className="mt-12 inline-flex w-full items-center justify-center rounded-lg border border-rose-300 bg-rose-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-rose-700"
                >
                  Tạm dừng
                </button>
              </section>

              <section
                className={`min-h-[420px] overflow-hidden rounded-[28px] border p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] ${toneStyles.shell}`}
              >
                <div className="relative flex min-h-[372px] flex-col overflow-hidden">
                  <div
                    className={`absolute inset-y-5 left-0 w-1.5 rounded-r-full ${toneStyles.rail}`}
                  />
                  <div className="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-blue-50" />
                  <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-50" />

                  <div className="relative z-10 flex flex-1 flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${toneStyles.badge}`}
                      >
                        {toneStyles.chipIcon}
                        <span>
                          {lastValidation.tone === "green"
                            ? "Sẵn sàng"
                            : lastValidation.tone === "amber"
                              ? "Cần kiểm tra"
                              : "Từ chối"}
                        </span>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {currentGateName}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
                        {toneStyles.heroIcon}
                      </div>
                      <div
                        className={`text-xs font-bold uppercase tracking-[0.28em] ${toneStyles.accent}`}
                      >
                        {modeLabel}
                      </div>
                      <div className="mt-2 text-3xl font-black uppercase leading-tight text-slate-900 sm:text-4xl">
                        {lastValidation.title}
                      </div>
                      <div className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500">
                        {lastValidation.subtitle}
                      </div>

                      {lastValidation.message ? (
                        <div
                          className={`mt-6 w-full max-w-3xl rounded-[20px] border p-4 text-left ${toneStyles.panel}`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            Lý do / Hướng dẫn xử lý
                          </div>
                          <div className="mt-2 text-base font-bold text-slate-900">
                            {lastValidation.message}
                          </div>
                          {lastValidation.detail ? (
                            <div className="mt-1 text-sm leading-6 text-slate-600">
                              {lastValidation.detail}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "Mã vé",
                          value:
                            lastScan?.ticketCode || lastScan?.ticketId || "-",
                        },
                        { label: "Cổng", value: resultGateLabel },
                        {
                          label: "Thời gian",
                          value: formatScanTime(lastScan?.scannedAt),
                        },
                        { label: "Ga", value: resultStationLabel },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[16px] border border-slate-100 bg-slate-50 px-5 py-4 text-center"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            {item.label}
                          </div>
                          <div className="mt-2 text-base font-bold text-slate-900">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom log */}
            <section className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Nhật ký hoạt động gần đây
                  </div>
                  <h2 className="mt-1 text-lg font-bold leading-6 text-slate-800">
                    Lịch sử quét gần đây (10 lượt cuối)
                  </h2>
                </div>
                {logError ? (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                    {logError}
                  </span>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[864px]">
                  <div className="grid grid-cols-[176px_144px_240px_192px_192px] border-b border-slate-200 bg-slate-50/90">
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Thời gian
                    </div>
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Mã cổng
                    </div>
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Mã vé
                    </div>
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Hành động
                    </div>
                    <div className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Kết quả
                    </div>
                  </div>

                  {logLoading ? (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">
                      Đang tải lịch sử quét...
                    </div>
                  ) : log.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">
                      Không có lượt quét tại cổng đã chọn.
                    </div>
                  ) : (
                    log.map((row, idx) => (
                      <div
                        key={
                          row.id || `${row.scannedAt}-${row.ticketId}-${idx}`
                        }
                        className={`grid grid-cols-[176px_144px_240px_192px_192px] bg-white transition hover:bg-slate-50/70 ${
                          idx === 0 ? "" : "border-t border-slate-100"
                        }`}
                      >
                        <div className="px-6 py-4 text-sm font-normal leading-5 text-slate-600">
                          {formatScanTime(row.scannedAt)}
                        </div>
                        <div className="px-6 py-4 text-sm font-medium leading-5 text-slate-900">
                          {row.gateCode || row.gateId || "-"}
                        </div>
                        <div className="px-6 py-4 font-mono text-sm font-normal leading-5 text-blue-600">
                          {row.ticketCode || row.ticketId || "-"}
                        </div>
                        <div className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                              ["IN", "TAP-IN"].includes(
                                row.action?.toUpperCase().replace("_", "-"),
                              )
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {["IN", "TAP-IN"].includes(
                              row.action?.toUpperCase().replace("_", "-"),
                            )
                              ? "Vào ga"
                              : ["OUT", "TAP-OUT"].includes(
                                    row.action?.toUpperCase().replace("_", "-"),
                                  )
                                ? "Ra ga"
                                : row.action || "-"}
                          </span>
                        </div>
                        <div className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                              ["ALLOW", "SUCCESS", "ACCEPTED"].includes(
                                row.result?.toUpperCase(),
                              )
                                ? "bg-green-100 text-green-700"
                                : ["DENY", "NOT_ALLOWED"].includes(
                                      row.result?.toUpperCase(),
                                    )
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {["ALLOW", "SUCCESS", "ACCEPTED"].includes(
                              row.result?.toUpperCase(),
                            )
                              ? "Cho phép"
                              : ["DENY", "NOT_ALLOWED"].includes(
                                    row.result?.toUpperCase(),
                                  )
                                ? "Từ chối"
                                : row.result || "-"}
                          </span>
                          {row.message ? (
                            <div className="mt-1 text-xs font-medium leading-4 text-slate-500">
                              {row.message}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffScanPage, { allowedRoles: ["staff", "admin"] });
