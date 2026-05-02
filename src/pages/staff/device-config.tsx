import { useMemo, useState } from "react";
import StaffPortalShell from "@/components/templates/StaffPortalShell";

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

export default function DeviceConfigPage() {
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
  const [selectedId, setSelectedId] = useState("gate-a-02");

  const [gateMode, setGateMode] = useState<(typeof modeOptions)[number]["value"]>("bi");
  const [sensorDelay, setSensorDelay] = useState(1.5);
  const [volume, setVolume] = useState(70);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true);

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
    () => devices.find((device) => device.id === selectedId) ?? devices[0],
    [devices, selectedId],
  );

  return (
    <StaffPortalShell
      headerMode="stacked"
      breadcrumb={{ section: "Staff Portal", page: "Cấu hình" }}
      headerTitle="Cấu hình thiết bị"
      systemStatus={{ label: "HỆ THỐNG TRỰC TUYẾN", tone: "blue" }}
    >
      <div className="-m-8 flex min-h-[calc(100vh-4rem)] bg-neutral-100">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden p-8">
            <div className="w-full max-w-[1024px] space-y-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm kiếm thiết bị..."
                      className="h-10 w-64 rounded-xl bg-white pl-10 pr-4 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 placeholder:text-gray-500"
                    />
                    <span
                      className="absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded bg-slate-400"
                      aria-hidden="true"
                    />
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
                  <span className="h-2.5 w-2.5 rounded bg-white" aria-hidden="true" />
                  Thêm thiết bị
                </button>
              </div>

              <div className="overflow-hidden rounded-xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
                <div className="bg-slate-50">
                  <div className="grid grid-cols-[16rem_7rem_10rem_8rem_7rem] items-start">
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
                        onClick={() => setSelectedId(device.id)}
                        className={`grid w-full grid-cols-[16rem_7rem_10rem_8rem_7rem] items-center gap-0 text-left transition ${
                          idx === 0 ? "" : "border-t border-slate-100"
                        } ${isSelected ? "bg-slate-50 border-l-4 border-blue-600 pl-5 pr-6" : "px-6"}`}
                      >
                        <div className="flex items-center gap-3 py-4">
                          <div
                            className={`flex h-10 w-7 items-center justify-center rounded-xl ${
                              device.type === "KIOSK" ? "bg-orange-100" : "bg-blue-100"
                            }`}
                          >
                            <span
                              className={`h-5 w-4 rounded ${
                                device.type === "KIOSK" ? "bg-orange-600" : "bg-blue-600"
                              }`}
                              aria-hidden="true"
                            />
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

          <aside className="w-96 shrink-0 overflow-hidden border-l border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="text-base font-bold leading-6 text-slate-800">Chi tiết cấu hình</div>
              <button type="button" className="rounded-lg p-1 hover:bg-slate-50" aria-label="Close">
                <span className="h-3.5 w-3.5 rounded bg-slate-400" aria-hidden="true" />
              </button>
            </div>

            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10">
                      <span className="h-6 w-5 rounded bg-blue-600" aria-hidden="true" />
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
                              onClick={() => setGateMode(opt.value)}
                              className={`flex w-full items-center justify-between rounded-xl p-3 text-left outline outline-1 outline-offset-[-1px] ${
                                checked ? "outline-blue-600" : "outline-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`h-4 w-5 rounded ${checked ? "bg-blue-600" : "bg-slate-400"}`}
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
                        onChange={(e) => setSensorDelay(Number(e.target.value))}
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
                        <span className="h-3 w-2.5 rounded bg-slate-400" aria-hidden="true" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="h-3.5 w-3.5 rounded bg-slate-400" aria-hidden="true" />
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
                          onClick={() => setAutoRestartEnabled((prev) => !prev)}
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
                    setGateMode("bi");
                    setSensorDelay(1.5);
                    setVolume(70);
                    setAutoRestartEnabled(true);
                  }}
                  className="flex-1 rounded-xl px-14 py-2.5 text-sm font-bold leading-5 text-slate-600 outline outline-1 outline-offset-[-1px] outline-slate-200"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold leading-5 text-white shadow-[0px_1px_2px_0px_rgba(19,127,236,0.20)]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </StaffPortalShell>
  );
}
