import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import { withAuth } from "@components/templates/withAuth";
import { CheckCircle2, XCircle, AlertTriangle, Camera, CameraOff, Loader2 } from "lucide-react";
import { staffGateApi } from "@features/staffGate/staffGateApi";
import type { GateResponse, GateScanLogResponse, GateScanResponse } from "@features/staffGate/staffGateTypes";
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

const DEFAULT_DEVICE_ID = "WEB_SCANNER";

type ValidationResult = {
  status: string;
  title: string;
  subtitle: string;
  message: string;
  tone: "green" | "red" | "amber";
};

function matchesMode(action: string | undefined, mode: TapMode) {
  if (!action) return true;
  const normalized = action.toUpperCase().replace("_", "-");
  return mode === "TAP-IN"
    ? normalized === "IN" || normalized === "TAP-IN"
    : normalized === "OUT" || normalized === "TAP-OUT";
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

function StaffScanPage() {
  const [stations, setStations] = useState<StationResponse[]>([]);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [station, setStation] = useState("");
  const [gate, setGate] = useState("");
  const [filterLoading, setFilterLoading] = useState(true);
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
  const [lastValidation, setLastValidation] = useState<ValidationResult>({
    status: "SUCCESS",
    title: "Sẵn sàng",
    subtitle: "Chọn ga, cổng và quét vé",
    message: "",
    tone: "green",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const scannerReaderRef = useRef<unknown | null>(null);

  const todayLabel = useMemo(() => formatTodayVi(), []);
  const availableGates = useMemo(
    () => gates.filter((item) => (!station || item.stationId === station) && matchesMode(item.action, mode)),
    [gates, mode, station],
  );
  const resultStationLabel =
    stations.find((item) => item.stationId === lastScan?.stationId)?.name ??
    lastScan?.stationId ??
    "-";
  const resultGateLabel =
    gates.find((item) => item.gateId === lastScan?.gateId)?.gateCode ??
    lastScan?.gateId ??
    "-";

  const loadLogs = useCallback(async () => {
    if (!station || !gate) {
      setLog([]);
      return;
    }

    setLogLoading(true);
    try {
      const data = await staffGateApi.getLogs({ stationId: station, gateId: gate });
      const latest = [...data]
        .sort((left, right) => (right.scannedAt ?? "").localeCompare(left.scannedAt ?? ""))
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
      apiClient.get(API_ENDPOINTS.gates.staff),
    ])
      .then(([stationResponse, gateResponse]) => {
        if (cancelled) return;
        const stationData = unwrapApiResponse<StationResponse[]>(stationResponse.data);
        const gateData = unwrapApiResponse<GateResponse[]>(gateResponse.data);
        const stationItems = Array.isArray(stationData) ? stationData : [];
        const gateItems = Array.isArray(gateData) ? gateData : [];
        setStations(stationItems);
        setGates(gateItems);
        const initialStationId = stationItems[0]?.stationId || "";
        setStation((current) => current || initialStationId);
        setGate(
          (current) =>
            current ||
            gateItems.find(
              (item) =>
                (!initialStationId || item.stationId === initialStationId) &&
                matchesMode(item.action, "TAP-IN"),
            )?.gateId ||
            "",
        );
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

  const runScan = async (rawToken: string) => {
    if (!station || !gate) {
      setLastValidation({
        status: "INVALID",
        title: "Bị từ chối",
        subtitle: "Chưa chọn ga hoặc cổng",
        message: "Vui lòng chọn ga và cổng trước khi quét.",
        tone: "amber",
      });
      return;
    }

    const trimmed = rawToken.trim();

    if (!trimmed) {
      setLastScan(null);
      setLastValidation({
        status: "INVALID",
        title: "Bị từ chối",
        subtitle: "Token không hợp lệ",
        message: "Thiếu dữ liệu token QR",
        tone: "red",
      });
      return;
    }

    setIsScanning(true);
    try {
      const result = await staffGateApi.scan({
        qrContent: trimmed,
        deviceId: DEFAULT_DEVICE_ID,
        stationId: station,
        gateId: gate,
      });

      const statusRaw = String(result.result ?? "").toUpperCase();
      const ok = statusRaw === "SUCCESS" || statusRaw === "ACCEPTED";

      const message = result.message || (ok ? "ACCEPTED" : "REJECTED");

      const validation: ValidationResult = ok
        ? {
            status: "SUCCESS",
            title: "Chấp nhận",
            subtitle: "Giao dịch thành công - Mở cổng",
            message,
            tone: "green",
          }
        : {
            status: "INVALID",
            title: "Bị từ chối",
            subtitle: "Giao dịch bị từ chối",
            message,
            tone: "red",
          };

      setLastScan(result);
      setLastValidation(validation);
      await loadLogs();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể gọi API /staff/gates/scan";
      setLastScan(null);
      setLastValidation({
        status: "INVALID",
        title: "Bị từ chối",
        subtitle: "Không thể xử lý yêu cầu quét",
        message,
        tone: "red",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    try {
      scannerControlsRef.current?.stop();
    } finally {
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
        setCameraError(message);
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
        <title>Quét vé | MetroNext</title>
      </Head>
      <StaffLayout>
        <div className="relative">
          <div className="mb-6">
            <nav className="text-xs text-gray-400 mb-1">
              <span>Nhân viên ga</span>
              <span className="mx-1">›</span>
              <span className="text-blue-600 font-medium">Quét vé</span>
            </nav>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900">Quét vé - Điều khiển cổng</h1>
              <p className="text-sm text-slate-500">{todayLabel}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[384px_minmax(0,1fr)]">
              {/* Left panel */}
              <section className="rounded-3xl bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="block text-sm font-semibold leading-5 text-slate-700">
                      Chọn ga
                    </span>
                    <div className="relative">
                      <select
                        value={station}
                        onChange={(e) => {
                          const stationId = e.target.value;
                          setStation(stationId);
                          setGate(
                            gates.find((item) => item.stationId === stationId && matchesMode(item.action, mode))
                              ?.gateId ?? "",
                          );
                        }}
                        disabled={filterLoading}
                        className="h-11 w-full appearance-none rounded-2xl bg-slate-50 px-4 pr-10 text-sm font-normal leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                      >
                        {stations.length === 0 && <option value="">Không có ga</option>}
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
                    <span className="block text-sm font-semibold leading-5 text-slate-700">
                      Cổng (Gate ID)
                    </span>
                    <div className="relative">
                      <select
                        value={gate}
                        onChange={(e) => setGate(e.target.value)}
                        disabled={filterLoading || !station}
                        className="h-11 w-full appearance-none rounded-2xl bg-slate-50 px-4 pr-10 text-sm font-normal leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                      >
                        {availableGates.length === 0 && <option value="">Không có cổng</option>}
                        {availableGates.map((g) => (
                          <option key={g.gateId} value={g.gateId}>
                            {g.gateCode}{g.name ? ` - ${g.name}` : ""}
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

                <div className="mt-4 space-y-1.5">
                  <p className="text-sm font-semibold leading-5 text-slate-700">
                    QR Token Input
                  </p>
                  <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Nhập chuỗi token QR tại đây để giả lập quét..."
                    className="min-h-[144px] w-full resize-none rounded-2xl bg-slate-50 px-4 py-4 font-mono text-sm leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 placeholder:text-gray-500"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold leading-5 text-slate-700">
                      Quét bằng camera
                    </p>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold outline outline-1 outline-offset-[-1px] transition ${
                        isCameraOn
                          ? "bg-slate-900 text-white outline-slate-900"
                          : "bg-white text-slate-900 outline-slate-200"
                      }`}
                      onClick={() => {
                        if (isCameraOn) stopCamera();
                        else setIsCameraOn(true);
                      }}
                    >
                      {isCameraOn ? (
                        <CameraOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Camera className="h-4 w-4" aria-hidden="true" />
                      )}
                      {isCameraOn ? "Tắt camera" : "Mở camera"}
                    </button>
                  </div>

                  {cameraError ? (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                      {cameraError}
                    </div>
                  ) : null}

                  {isCameraOn ? (
                    <div className="overflow-hidden rounded-2xl bg-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200">
                      <div className="flex items-center justify-between px-4 py-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-white/80">
                          Camera preview
                        </div>
                        {isCameraStarting ? (
                          <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/80">
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                            Đang khởi động...
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-white/60">
                            Đưa mã QR vào khung
                          </div>
                        )}
                      </div>
                      <video
                        ref={videoRef}
                        className="h-56 w-full object-cover"
                        muted
                        playsInline
                      />
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={filterLoading || isScanning || !station || !gate}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-base font-bold leading-6 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={() => {
                    runScan(token);
                  }}
                >
                  {isScanning ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="h-5 w-5 rounded bg-white" aria-hidden="true" />
                  )}
                  {isScanning ? "ĐANG QUÉT..." : "QUÉT VÉ"}
                </button>

                <div className="mt-4 flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("TAP-IN");
                      setGate(
                        gates.find((item) => item.stationId === station && matchesMode(item.action, "TAP-IN"))
                          ?.gateId ?? "",
                      );
                    }}
                    className={`flex-1 rounded-3xl px-4 py-7 text-center outline outline-2 outline-offset-[-2px] transition ${
                      mode === "TAP-IN"
                        ? "bg-blue-600/10 outline-blue-600/50"
                        : "bg-slate-100 outline-slate-200"
                    }`}
                  >
                    <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center">
                      <span
                        className={`h-6 w-6 rounded ${mode === "TAP-IN" ? "bg-blue-600" : "bg-slate-700"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={`text-base font-bold leading-6 ${
                        mode === "TAP-IN" ? "text-blue-600" : "text-slate-700"
                      }`}
                    >
                      Tap-In (Vào ga)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("TAP-OUT");
                      setGate(
                        gates.find((item) => item.stationId === station && matchesMode(item.action, "TAP-OUT"))
                          ?.gateId ?? "",
                      );
                    }}
                    className={`flex-1 rounded-3xl p-4 text-center outline outline-2 outline-offset-[-2px] transition ${
                      mode === "TAP-OUT"
                        ? "bg-blue-600/10 outline-blue-600/50"
                        : "bg-slate-100 outline-slate-200"
                    }`}
                  >
                    <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center">
                      <span
                        className={`h-6 w-6 rounded ${mode === "TAP-OUT" ? "bg-blue-600" : "bg-slate-700"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={`text-base font-bold leading-6 ${
                        mode === "TAP-OUT" ? "text-blue-600" : "text-slate-700"
                      }`}
                    >
                      Tap-Out (Ra
                      <br />
                      ga)
                    </div>
                  </button>
                </div>
              </section>

              {/* Right panel */}
              <section
                className={`rounded-3xl p-8 shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg ${
                  lastValidation.tone === "green"
                    ? "bg-green-500"
                    : lastValidation.tone === "amber"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              >
                <div className="relative overflow-hidden">
                  <div className="pointer-events-none absolute -right-4 -top-10">
                    <div className="h-40 w-40 rounded-full bg-white/15" />
                  </div>

                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-[2px]">
                    {lastValidation.tone === "green" ? (
                      <CheckCircle2
                        className="h-12 w-12 text-white"
                        aria-hidden="true"
                      />
                    ) : lastValidation.tone === "amber" ? (
                      <AlertTriangle
                        className="h-12 w-12 text-white"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="h-12 w-12 text-white"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <div className="text-4xl font-black uppercase leading-10 tracking-[3.60px] text-white">
                      {lastValidation.title}
                    </div>
                    <div className="mt-1 text-base font-medium leading-6 text-white/90">
                      {lastValidation.subtitle}
                    </div>
                    {lastValidation.message ? (
                      <div className="mt-2 text-sm font-medium leading-5 text-white/90">
                        {lastValidation.message}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Ticket ID", value: lastScan?.ticketCode || lastScan?.ticketId || "-" },
                      { label: "Gate", value: resultGateLabel },
                      {
                        label: "Time",
                        value: formatScanTime(lastScan?.scannedAt),
                      },
                      { label: "Station", value: resultStationLabel },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl bg-white/10 p-4 backdrop-blur-[6px]"
                      >
                        <div className="text-[10px] font-bold uppercase leading-4 text-white/80">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-base font-bold leading-6 text-white">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

          {/* Bottom log */}
          <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-bold leading-6 text-slate-800">
                Lịch sử quét gần đây (10 lượt cuối)
              </h2>
              {logError ? <span className="text-xs font-medium text-red-600">{logError}</span> : null}
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[864px]">
                <div className="grid grid-cols-[176px_144px_240px_192px_192px] bg-slate-50">
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Thời gian</div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Gate ID</div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Ticket ID</div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Hành động</div>
                  <div className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">Kết quả</div>
                </div>

                {logLoading ? (
                  <div className="px-6 py-8 text-center text-sm text-slate-500">
                    Đang tải lịch sử quét...
                  </div>
                ) : log.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-slate-500">
                    Không có lượt quét tại cổng đã chọn.
                  </div>
                ) : log.map((row, idx) => (
                  <div
                    key={row.id || `${row.scannedAt}-${row.ticketId}-${idx}`}
                    className={`grid grid-cols-[176px_144px_240px_192px_192px] ${
                      idx === 0 ? "" : "border-t border-slate-100"
                    }`}
                  >
                    <div className="px-6 py-4 text-sm font-normal leading-5 text-slate-600">{formatScanTime(row.scannedAt)}</div>
                    <div className="px-6 py-4 text-sm font-medium leading-5 text-slate-900">{row.gateCode || row.gateId || "-"}</div>
                    <div className="px-6 py-4 font-mono text-sm font-normal leading-5 text-blue-600">{row.ticketCode || row.ticketId || "-"}</div>
                    <div className="px-6 py-4">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                        ["IN", "TAP-IN"].includes(row.action?.toUpperCase().replace("_", "-")) ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                      }`}>{row.action || "-"}</span>
                    </div>
                    <div className="px-6 py-4 text-right">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                        ["SUCCESS", "ACCEPTED"].includes(row.result?.toUpperCase()) ? "bg-green-100 text-green-700"
                          : row.result?.toUpperCase() === "NOT_ALLOWED" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>{row.result || "-"}</span>
                      {row.message ? <div className="mt-1 text-xs font-medium leading-4 text-slate-500">{row.message}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffScanPage, { allowedRoles: ["staff", "admin"] });
