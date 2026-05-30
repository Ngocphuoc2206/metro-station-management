import Head from "next/head";
import { useMemo, useState } from "react";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import { withAuth } from "@components/templates/withAuth";
import {
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Cable,
  DoorOpen,
  Monitor,
  Volume1,
  Volume2,
  SlidersHorizontal,
} from "lucide-react";

type DeviceType = "GATE" | "KIOSK";

type DeviceStatus = "active" | "offline" | "alert";

type DeviceItem = {
  id: string;
  nameLine1: string;
  nameLine2: string;
  stationLine1: string;
  stationLine2?: string;
  type: DeviceType;
  modelLines: string[];
  ip: string;
  firmware: string;
  status: DeviceStatus;
  serial: string;
};

const statusBadge: Record<
  DeviceStatus,
  { container: string; dot: string; text: string; labelLine1: string; labelLine2?: string }
> = {
  active: {
    container: "bg-green-100",
    dot: "bg-green-500",
    text: "text-green-700",
    labelLine1: "Hoạt",
    labelLine2: "động",
  },
  offline: {
    container: "bg-slate-100",
    dot: "bg-slate-400",
    text: "text-slate-700",
    labelLine1: "Ngoại",
    labelLine2: "tuyến",
  },
  alert: {
    container: "bg-red-100",
    dot: "bg-red-500",
    text: "text-red-700",
    labelLine1: "Cảnh",
    labelLine2: "báo",
  },
};

const modeOptions = [
  { value: "bi", label: "Bi-directional" },
  { value: "in", label: "Chỉ lối vào (In)" },
  { value: "out", label: "Chỉ lối ra (Out)" },
] as const;

function DeviceConfigPage() {
  const devices = useMemo<DeviceItem[]>(
    () => [
      {
        id: "gate-a-01",
        nameLine1: "Gate",
        nameLine2: "A-01",
        stationLine1: "Ga Bến",
        stationLine2: "Thành",
        type: "GATE",
        modelLines: ["GTX-", "500", "Metro"],
        ip: "192.168.1.101",
        firmware: "v2.4.1",
        status: "active",
        serial: "MN-GT-2024-0011",
      },
      {
        id: "gate-a-02",
        nameLine1: "Gate",
        nameLine2: "A-02",
        stationLine1: "Ga Bến",
        stationLine2: "Thành",
        type: "GATE",
        modelLines: ["GTX-", "500", "Metro"],
        ip: "192.168.1.102",
        firmware: "v2.4.1",
        status: "active",
        serial: "MN-GT-2024-0012",
      },
      {
        id: "kiosk-k-01",
        nameLine1: "Kiosk",
        nameLine2: "K-01",
        stationLine1: "Ga Bến",
        stationLine2: "Thành",
        type: "KIOSK",
        modelLines: ["TVM-", "1000", "Pro"],
        ip: "192.168.1.201",
        firmware: "v1.8.5",
        status: "offline",
        serial: "MN-KS-2024-0041",
      },
      {
        id: "gate-b-01",
        nameLine1: "Gate",
        nameLine2: "B-01",
        stationLine1: "Ga Bến",
        stationLine2: "Thành",
        type: "GATE",
        modelLines: ["GTX-", "500", "Metro"],
        ip: "192.168.1.103",
        firmware: "v2.4.1",
        status: "alert",
        serial: "MN-GT-2024-0013",
      },
    ],
    [],
  );

  const [query, setQuery] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<DeviceType | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [gateMode, setGateMode] = useState<(typeof modeOptions)[number]["value"]>("bi");
  const [sensorDelay, setSensorDelay] = useState(1.5);
  const [volume, setVolume] = useState(70);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true);

  const [ip, setIp] = useState("");
  const [firmware, setFirmware] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const filteredDevices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesType = deviceTypeFilter === "ALL" ? true : device.type === deviceTypeFilter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : `${device.nameLine1} ${device.nameLine2} ${device.ip} ${device.serial}`
              .toLowerCase()
              .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [devices, deviceTypeFilter, query]);

  const selectedDevice = useMemo(
    () => (selectedId ? devices.find((device) => device.id === selectedId) ?? null : null),
    [devices, selectedId],
  );

  const ipError = useMemo(() => {
    if (!selectedDevice) return "";
    const value = ip.trim();
    if (value.length === 0) return "IP không được để trống";
    const ok = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split(".").every((p) => {
      const n = Number(p);
      return Number.isInteger(n) && n >= 0 && n <= 255;
    });
    return ok ? "" : "IP không hợp lệ";
  }, [ip, selectedDevice]);

  const firmwareError = useMemo(() => {
    if (!selectedDevice) return "";
    const value = firmware.trim();
    if (value.length === 0) return "Firmware không được để trống";
    return /^v\d+\.(?:\d+\.)?\d+$/.test(value) ? "" : "Firmware không hợp lệ (vd: v2.4.1)";
  }, [firmware, selectedDevice]);

  const hasErrors = Boolean(ipError || firmwareError);

  const tableGrid = selectedDevice
    ? "grid-cols-[16rem_7rem_10rem_8rem_7rem]"
    : "grid-cols-[minmax(0,1fr)_9rem_14rem_9rem_8rem]";

  return (
    <>
      <Head><title>Cấu hình thiết bị | MetroNext</title></Head>
      <StaffLayout>
        <div className="-mx-6 -my-6 flex min-h-[calc(100vh-4rem)] bg-neutral-100">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden p-6">
              <div className="mb-5">
                <nav className="text-xs text-gray-400 mb-0.5">
                  <span>Staff Portal</span>
                  <span className="mx-1">›</span>
                  <span className="text-blue-600 font-medium">Cấu hình</span>
                </nav>
                <h1 className="text-xl font-bold text-gray-900">Cấu hình thiết bị</h1>
              </div>
              <div className={`w-full space-y-6 ${selectedDevice ? "max-w-[1024px]" : "max-w-[1280px]"}`}>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm kiếm thiết bị..."
                      className="h-10 w-64 rounded-xl bg-white pl-10 pr-4 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 placeholder:text-gray-500"
                    />
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  </div>

                  <select
                    value={deviceTypeFilter}
                    onChange={(e) => setDeviceTypeFilter(e.target.value as DeviceType | "ALL")}
                    className="h-10 w-40 appearance-none rounded-xl bg-white px-4 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                  >
                    <option value="ALL">Tất cả loại thiết bị</option>
                    <option value="GATE">Gate</option>
                    <option value="KIOSK">Kiosk</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold leading-5 text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Thêm thiết bị
                </button>
              </div>

              <div className="overflow-hidden rounded-xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
                <div className="bg-slate-50">
                  <div className={`grid ${tableGrid} items-start`}>
                    <div className="px-6 py-5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Tên thiết bị
                    </div>
                    <div className="px-6 py-5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Model
                    </div>
                    <div className="px-6 py-5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Địa chỉ IP
                    </div>
                    <div className="px-6 py-5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Firmware
                    </div>
                    <div className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Trạng
                      <br />
                      thái
                    </div>
                  </div>
                </div>

                <div>
                  {filteredDevices.map((device, idx) => {
                    const isSelected = device.id === selectedId;
                    const badge = statusBadge[device.status];

                    return (
                      <button
                        key={device.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(device.id);
                          setIp(device.ip);
                          setFirmware(device.firmware);
                          setSaveState("idle");
                        }}
                        className={`grid w-full ${tableGrid} items-center gap-0 text-left transition ${
                          idx === 0 ? "" : "border-t border-slate-100"
                        } ${isSelected ? "bg-slate-50 border-l-4 border-blue-600 pl-5 pr-6" : "px-6"}`}
                      >
                        <div className="flex items-center gap-3 py-4">
                          <div
                            className={`flex h-10 w-7 items-center justify-center rounded-xl ${
                              device.type === "KIOSK" ? "bg-orange-100" : "bg-blue-100"
                            }`}
                          >
                            {device.type === "KIOSK" ? (
                              <Monitor className="h-4 w-4 text-orange-700" aria-hidden="true" />
                            ) : (
                              <DoorOpen className="h-4 w-4 text-blue-700" aria-hidden="true" />
                            )}
                          </div>

                          <div>
                            <div className="text-sm font-bold leading-5 text-slate-800">
                              {device.nameLine1}
                              <br />
                              {device.nameLine2}
                            </div>
                            <div className="text-xs font-normal leading-4 text-slate-500">
                              {device.stationLine1}
                              <br />
                              {device.stationLine2 ?? ""}
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-5 text-sm font-medium leading-5 text-slate-600">
                          {device.modelLines.map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </div>

                        <div className="px-6 py-5 font-mono text-sm font-normal leading-5 text-slate-500">
                          {device.ip}
                        </div>

                        <div className="px-6 py-5 text-sm font-medium leading-5 text-slate-600">
                          {device.firmware}
                        </div>

                        <div className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-4 py-0.5 ${badge.container}`}
                          >
                            <span className={`h-1.5 w-1 rounded-full ${badge.dot}`} aria-hidden="true" />
                            <div className={`text-xs font-bold leading-4 ${badge.text}`}>
                              {badge.labelLine1}
                              <br />
                              {badge.labelLine2}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
            </div>

            {selectedDevice ? (
            <aside className="w-96 shrink-0 overflow-hidden border-l border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="text-base font-bold leading-6 text-slate-800">Chi tiết cấu hình</div>
                  {saveState === "saved" ? (
                    <div className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                      Đã lưu
                    </div>
                  ) : saveState === "error" ? (
                    <div className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                      Lỗi
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 hover:bg-slate-50"
                  aria-label="Close"
                  onClick={() => {
                    setSelectedId(null);
                    setSaveState("idle");
                  }}
                >
                  <X className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </button>
              </div>

              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-auto p-6">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10">
                        <SlidersHorizontal className="h-6 w-6 text-blue-700" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-base font-bold leading-6 text-slate-900">
                          {selectedDevice.nameLine1} {selectedDevice.nameLine2}
                        </div>
                        <div className="text-xs font-medium leading-4 text-slate-500">
                          SN: {selectedDevice.serial}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-400">
                        Thông tin thiết bị
                      </div>

                      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 outline outline-1 outline-offset-[-1px] outline-slate-200">
                        <label className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Địa chỉ IP</div>
                          <input
                            value={ip}
                            onChange={(e) => {
                              setIp(e.target.value);
                              setSaveState("idle");
                            }}
                            className={`h-10 w-full rounded-xl bg-white px-3 font-mono text-sm text-slate-900 outline outline-1 outline-offset-[-1px] ${
                              ipError ? "outline-red-200" : "outline-slate-200"
                            }`}
                            placeholder="192.168.1.101"
                          />
                          {ipError ? <div className="text-xs font-medium text-red-600">{ipError}</div> : null}
                        </label>

                        <label className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Firmware</div>
                          <input
                            value={firmware}
                            onChange={(e) => {
                              setFirmware(e.target.value);
                              setSaveState("idle");
                            }}
                            className={`h-10 w-full rounded-xl bg-white px-3 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] ${
                              firmwareError ? "outline-red-200" : "outline-slate-200"
                            }`}
                            placeholder="v2.4.1"
                          />
                          {firmwareError ? (
                            <div className="text-xs font-medium text-red-600">{firmwareError}</div>
                          ) : null}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-400">
                        Chế độ cổng
                      </div>
                      <div className="space-y-2">
                        {modeOptions.map((opt) => {
                          const checked = gateMode === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setGateMode(opt.value);
                                setSaveState("idle");
                              }}
                              className={`flex w-full items-center justify-between rounded-xl p-3 text-left outline outline-1 outline-offset-[-1px] ${
                                checked ? "outline-blue-600" : "outline-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Cable
                                  className={`h-4 w-4 ${checked ? "text-blue-700" : "text-slate-500"}`}
                                  aria-hidden="true"
                                />
                                <span className="text-sm font-medium leading-5 text-slate-900">
                                  {opt.label}
                                </span>
                              </div>
                              <span
                                className={`h-4 w-4 rounded-full ${
                                  checked ? "border-4 border-blue-600" : "border border-slate-300"
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-400">
                          Độ trễ cảm biến
                        </div>
                        <div className="text-xs font-bold leading-4 text-blue-600">{sensorDelay.toFixed(1)} giây</div>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.1}
                        value={sensorDelay}
                        onChange={(e) => {
                          setSensorDelay(Number(e.target.value));
                          setSaveState("idle");
                        }}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] font-medium leading-4 text-slate-400">
                        <span>0.5s</span>
                        <span>5.0s</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-400">
                          Âm lượng thông báo
                        </div>
                        <div className="text-xs font-bold leading-4 text-blue-600">{volume}%</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Volume1 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            setSaveState("idle");
                          }}
                          className="flex-1 accent-blue-600"
                        />
                        <Volume2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-400">
                        Tự động khởi động lại
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 outline outline-1 outline-offset-[-1px] outline-slate-200">
                        <div className="text-sm font-medium leading-5 text-slate-900">Hàng ngày (02:00 AM)</div>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoRestartEnabled((prev) => !prev);
                            setSaveState("idle");
                          }}
                          className={`flex h-5 w-10 items-center rounded-full px-1 transition ${
                            autoRestartEnabled ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                          }`}
                          aria-label="Toggle auto restart"
                        >
                          <span className="h-4 w-4 rounded-full bg-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-6">
                <button
                  type="button"
                  onClick={() => {
                    setIp(selectedDevice.ip);
                    setFirmware(selectedDevice.firmware);
                    setGateMode("bi");
                    setSensorDelay(1.5);
                    setVolume(70);
                    setAutoRestartEnabled(true);
                    setSaveState("idle");
                  }}
                  className="flex-1 rounded-xl px-14 py-2.5 text-sm font-bold leading-5 text-slate-600 outline outline-1 outline-offset-[-1px] outline-slate-200"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  disabled={hasErrors}
                  onClick={() => {
                    if (hasErrors) {
                      setSaveState("error");
                      return;
                    }
                    setSaveState("saved");
                    window.setTimeout(() => setSaveState("idle"), 2000);
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold leading-5 text-white shadow-[0px_1px_2px_0px_rgba(19,127,236,0.20)] ${
                    hasErrors ? "bg-blue-600/50" : "bg-blue-600"
                  }`}
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Lưu thay đổi
                </button>
              </div>
            </aside>
            ) : null}
          </div>
        </div>
      </StaffLayout>
    </>
  );
}

export default withAuth(DeviceConfigPage, { allowedRoles: ["staff", "admin"] });
