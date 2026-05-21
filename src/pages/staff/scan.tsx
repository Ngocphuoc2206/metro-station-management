import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import StaffPortalShell from "@components/templates/StaffPortalShell";
import { CheckCircle2, XCircle, AlertTriangle, Camera, CameraOff, Loader2 } from "lucide-react";
import { staffGateApi } from "@features/staffGate/staffGateApi";

type TapMode = "TAP-IN" | "TAP-OUT";

type ScanLogRow = {
  time: string;
  gateId: string;
  ticketId: string;
  action: TapMode;
  result: "SUCCESS" | "INVALID" | "EXPIRED" | "USED" | "NOT_ALLOWED";
  message: string;
};

const stations = ["Ga Bến Thành", "Ga Ba Son", "Ga Văn Thánh"];
const gates = ["Gate A-01", "Gate A-02", "Gate B-01"];

const DEFAULT_DEVICE_ID = "WEB_SCANNER";

const initialLog: ScanLogRow[] = [
  {
    time: "14:22:15",
    gateId: "A-01",
    ticketId: "MN-8849-2041",
    action: "TAP-IN",
    result: "SUCCESS",
    message: "ACCEPTED",
  },
  {
    time: "14:21:40",
    gateId: "A-01",
    ticketId: "MN-7721-1002",
    action: "TAP-OUT",
    result: "SUCCESS",
    message: "ACCEPTED",
  },
  {
    time: "14:19:02",
    gateId: "A-02",
    ticketId: "MN-1102-5534",
    action: "TAP-IN",
    result: "EXPIRED",
    message: "Vé hết hạn sử dụng",
  },
  {
    time: "14:18:15",
    gateId: "A-01",
    ticketId: "MN-9923-4122",
    action: "TAP-IN",
    result: "SUCCESS",
    message: "ACCEPTED",
  },
  {
    time: "14:15:33",
    gateId: "B-01",
    ticketId: "MN-4402-9912",
    action: "TAP-IN",
    result: "SUCCESS",
    message: "ACCEPTED",
  },
];

type ValidationResult = {
  status: ScanLogRow["result"];
  title: string;
  subtitle: string;
  message: string;
  tone: "green" | "red" | "amber";
};

function validateScan(params: {
  rawToken: string;
  gateLabel: string;
  stationLabel: string;
  mode: TapMode;
}): { ticketId: string; gateId: string; validation: ValidationResult } {
  const trimmed = params.rawToken.trim();
  const ticketId = trimmed.length > 0 ? trimmed.slice(0, 12).toUpperCase() : "";
  const gateId = params.gateLabel.replace("Gate ", "");

  if (trimmed.length === 0) {
    return {
      ticketId: "(empty)",
      gateId,
      validation: {
        status: "INVALID",
        title: "Từ chối",
        subtitle: "Token không hợp lệ",
        message: "Thiếu dữ liệu token QR",
        tone: "red",
      },
    };
  }

  if (ticketId.includes("1102")) {
    return {
      ticketId,
      gateId,
      validation: {
        status: "EXPIRED",
        title: "Từ chối",
        subtitle: "Vé đã hết hạn",
        message: "Vé hết hạn sử dụng",
        tone: "red",
      },
    };
  }

  if (ticketId.includes("7721")) {
    return {
      ticketId,
      gateId,
      validation: {
        status: "USED",
        title: "Từ chối",
        subtitle: "Vé đã được sử dụng",
        message: "Vé đã qua cổng trước đó",
        tone: "red",
      },
    };
  }

  if (params.mode === "TAP-OUT" && ticketId.includes("4402")) {
    return {
      ticketId,
      gateId,
      validation: {
        status: "NOT_ALLOWED",
        title: "Từ chối",
        subtitle: "Không đúng luồng",
        message: `Không cho phép Tap-Out tại ${params.stationLabel}`,
        tone: "amber",
      },
    };
  }

  return {
    ticketId,
    gateId,
    validation: {
      status: "SUCCESS",
      title: "Chấp nhận",
      subtitle: "Giao dịch thành công - Mở cổng",
      message: "ACCEPTED",
      tone: "green",
    },
  };
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

export default function StaffScanPage() {
  const [station, setStation] = useState(stations[0]);
  const [gate, setGate] = useState(gates[0]);
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<TapMode>("TAP-IN");
  const [log, setLog] = useState<ScanLogRow[]>(initialLog);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult>({
    status: "SUCCESS",
    title: "Chấp nhận",
    subtitle: "Giao dịch thành công - Mở cổng",
    message: "ACCEPTED",
    tone: "green",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const scannerReaderRef = useRef<unknown | null>(null);

  const todayLabel = useMemo(() => formatTodayVi(), []);

  const runScan = async (rawToken: string) => {
    const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    const trimmed = rawToken.trim();

    if (!trimmed) {
      const { ticketId, gateId, validation } = validateScan({
        rawToken,
        gateLabel: gate,
        stationLabel: station,
        mode,
      });

      setLastValidation(validation);
      setLog((prev) =>
        [
          {
            time,
            gateId,
            ticketId,
            action: mode,
            result: validation.status,
            message: validation.message,
          },
          ...prev,
        ].slice(0, 10)
      );
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

      const anyRes = result as Record<string, unknown>;
      const statusRaw = String(
        anyRes.status ?? anyRes.result ?? anyRes.code ?? "SUCCESS",
      ).toUpperCase();

      const ok =
        statusRaw.includes("SUCCESS") ||
        statusRaw.includes("ACCEPT") ||
        statusRaw === "1000";

      const ticketId = String(
        anyRes.ticketId ?? anyRes.ticketCode ?? anyRes.ticket ?? trimmed.slice(0, 12).toUpperCase(),
      );
      const gateId = String(anyRes.gateId ?? gate.replace("Gate ", ""));
      const message = String(anyRes.message ?? anyRes.reason ?? (ok ? "ACCEPTED" : "REJECTED"));

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
            title: "Từ chối",
            subtitle: "Quét vé thất bại",
            message,
            tone: "red",
          };

      setLastValidation(validation);
      setLog((prev) =>
        [
          {
            time,
            gateId,
            ticketId,
            action: mode,
            result: validation.status,
            message: validation.message,
          },
          ...prev,
        ].slice(0, 10)
      );
    } catch (err) {
      // fallback to local validation to keep tool usable when backend is down
      const { ticketId, gateId, validation } = validateScan({
        rawToken,
        gateLabel: gate,
        stationLabel: station,
        mode,
      });

      const message = err instanceof Error ? err.message : "Không thể gọi API /staff/gates/scan";
      const fallbackValidation: ValidationResult = {
        ...validation,
        subtitle: "Không thể gọi API - dùng chế độ mô phỏng",
        message,
        tone: "amber",
      };

      setLastValidation(fallbackValidation);
      setLog((prev) =>
        [
          {
            time,
            gateId,
            ticketId,
            action: mode,
            result: fallbackValidation.status,
            message: fallbackValidation.message,
          },
          ...prev,
        ].slice(0, 10)
      );
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
          }
        );

        scannerControlsRef.current = controls;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể mở camera";
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
        <title>Gate Scan Tool | MetroNext</title>
      </Head>

      <StaffPortalShell
        headerMode="title"
        headerTitle="MetroNext Gate Simulation & Scanning Tool"
        systemStatus={{ label: "GATE ACTIVE", tone: "green" }}
      >
        <div className="relative -m-8 bg-neutral-100">
          <div className="mx-auto w-full max-w-[1152px] px-8 py-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold leading-8 text-slate-900">
                Điều khiển cổng (Gate Control)
              </h1>
              <p className="text-sm font-normal leading-5 text-slate-500">{todayLabel}</p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[384px_minmax(0,1fr)]">
              {/* Left panel */}
              <section className="rounded-3xl bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="block text-sm font-semibold leading-5 text-slate-700">Chọn ga</span>
                    <div className="relative">
                      <select
                        value={station}
                        onChange={(e) => setStation(e.target.value)}
                        className="h-11 w-full appearance-none rounded-2xl bg-slate-50 px-4 pr-10 text-sm font-normal leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                      >
                        {stations.map((s) => (
                          <option key={s} value={s}>
                            {s}
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
                    <span className="block text-sm font-semibold leading-5 text-slate-700">Cổng (Gate ID)</span>
                    <div className="relative">
                      <select
                        value={gate}
                        onChange={(e) => setGate(e.target.value)}
                        className="h-11 w-full appearance-none rounded-2xl bg-slate-50 px-4 pr-10 text-sm font-normal leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                      >
                        {gates.map((g) => (
                          <option key={g} value={g}>
                            {g}
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

                <div className="mt-4 space-y-1.5">
                  <p className="text-sm font-semibold leading-5 text-slate-700">QR Token Input</p>
                  <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Nhập chuỗi token QR tại đây để giả lập quét..."
                    className="min-h-[144px] w-full resize-none rounded-2xl bg-slate-50 px-4 py-4 font-mono text-sm leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 placeholder:text-gray-500"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold leading-5 text-slate-700">Quét bằng camera</p>
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
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Đang khởi động...
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-white/60">Đưa mã QR vào khung</div>
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-base font-bold leading-6 text-white"
                  onClick={() => {
                    runScan(token);
                  }}
                >
                  <span className="h-5 w-5 rounded bg-white" aria-hidden="true" />
                  QUÉT VÉ
                </button>

                <div className="mt-4 flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("TAP-IN")}
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
                    onClick={() => setMode("TAP-OUT")}
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
                      <CheckCircle2 className="h-12 w-12 text-white" aria-hidden="true" />
                    ) : lastValidation.tone === "amber" ? (
                      <AlertTriangle className="h-12 w-12 text-white" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-12 w-12 text-white" aria-hidden="true" />
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <div className="text-4xl font-black uppercase leading-10 tracking-[3.60px] text-white">
                      {lastValidation.title}
                    </div>
                    <div className="mt-1 text-base font-medium leading-6 text-white/90">
                      {lastValidation.subtitle}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Ticket ID", value: log[0]?.ticketId ?? "-" },
                      { label: "Gate", value: gate },
                      { label: "Time", value: new Date().toLocaleTimeString("vi-VN", { hour12: false }) },
                      { label: "Station", value: station },
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
            <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-base font-bold leading-6 text-slate-800">
                  Transaction Log Preview (Last 10 Scans)
                </h2>
                <button type="button" className="text-sm font-semibold leading-5 text-blue-600">
                  Xem tất cả
                </button>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[864px]">
                  <div className="grid grid-cols-[176px_144px_240px_192px_192px] bg-slate-50">
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Thời gian
                    </div>
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Gate ID
                    </div>
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Ticket ID
                    </div>
                    <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Hành động
                    </div>
                    <div className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Kết quả
                    </div>
                  </div>

                  {log.map((row, idx) => (
                    <div
                      key={`${row.time}-${row.ticketId}-${idx}`}
                      className={`grid grid-cols-[176px_144px_240px_192px_192px] ${
                        idx === 0 ? "" : "border-t border-slate-100"
                      }`}
                    >
                      <div className="px-6 py-4 text-sm font-normal leading-5 text-slate-600">
                        {row.time}
                      </div>
                      <div className="px-6 py-4 text-sm font-medium leading-5 text-slate-900">
                        {row.gateId}
                      </div>
                      <div className="px-6 py-4 font-mono text-sm font-normal leading-5 text-blue-600">
                        {row.ticketId}
                      </div>
                      <div className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                            row.action === "TAP-IN"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {row.action}
                        </span>
                      </div>
                      <div className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                            row.result === "SUCCESS"
                              ? "bg-green-100 text-green-700"
                              : row.result === "NOT_ALLOWED"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.result}
                        </span>
                        <div className="mt-1 text-xs font-medium leading-4 text-slate-500">{row.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </StaffPortalShell>
    </>
  );
}
