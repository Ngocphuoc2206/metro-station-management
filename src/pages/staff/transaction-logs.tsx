import { useMemo, useState } from "react";
import StaffPortalShell from "@/components/templates/StaffPortalShell";

type TransactionRow = {
  time: string;
  station: string;
  gate: string;
  action: "Tap-In" | "Tap-Out";
  ticketCode: string;
  result: "Success" | "Rejected";
  reason?: string;
};

type TransactionDetail = {
  id: string;
  payload: Record<string, unknown>;
  payloadPretty: string;
};

const sampleRows: TransactionRow[] = [
  {
    time: "24/05/2024 14:22:15",
    station: "Ga Bến Thành",
    gate: "A-01",
    action: "Tap-In",
    ticketCode: "MN-8849-2041",
    result: "Success",
  },
  {
    time: "24/05/2024 14:21:40",
    station: "Ga Bến Thành",
    gate: "A-01",
    action: "Tap-Out",
    ticketCode: "MN-7721-1002",
    result: "Success",
  },
  {
    time: "24/05/2024 14:19:02",
    station: "Ga Suối Tiên",
    gate: "A-02",
    action: "Tap-In",
    ticketCode: "MN-1102-5534",
    result: "Rejected",
    reason: "Vé hết hạn sử dụng",
  },
  {
    time: "24/05/2024 14:18:15",
    station: "Ga Bến Thành",
    gate: "A-01",
    action: "Tap-In",
    ticketCode: "MN-9923-4122",
    result: "Success",
  },
  {
    time: "24/05/2024 14:15:33",
    station: "Ga Tân Cảng",
    gate: "B-01",
    action: "Tap-In",
    ticketCode: "MN-4402-9912",
    result: "Rejected",
    reason: "Thẻ chưa kích hoạt",
  },
  {
    time: "24/05/2024 14:12:05",
    station: "Ga Bến Thành",
    gate: "A-02",
    action: "Tap-In",
    ticketCode: "MN-3310-8821",
    result: "Success",
  },
];

const actionBadgeClass: Record<TransactionRow["action"], string> = {
  "Tap-In": "bg-blue-100 text-blue-700",
  "Tap-Out": "bg-orange-100 text-orange-700",
};

const resultBadgeClass: Record<TransactionRow["result"], string> = {
  Success: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function TransactionLogsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetail | null>(null);

  const [rangeLabel] = useState("24/05/2024 - 25/05/2024");
  const [station, setStation] = useState("all");
  const [gate, setGate] = useState("all");
  const [result, setResult] = useState("all");

  const rows = useMemo(() => sampleRows, []);

  const openDetail = (row: TransactionRow) => {
    const id = `TXN_${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const payload = {
      timestamp: "2024-05-24T14:22:15.827Z",
      gate_id: row.gate,
      station_id: row.station
        .toUpperCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "")
        .replace(/^GA_/, "ST_"),
      action: row.action === "Tap-In" ? "TAP_IN" : "TAP_OUT",
      ticket: {
        code: row.ticketCode,
        type: "SINGLE_PASS",
        issued_at: "2024-05-24T08:12:00Z",
        holder: "Nguyen Van A",
      },
      result: {
        status: row.result === "Success" ? "ACCEPTED" : "REJECTED",
        code: row.result === "Success" ? 200 : 403,
        message:
          row.result === "Success"
            ? "Transaction validated successfully"
            : row.reason ?? "Transaction rejected",
        gate_command: row.result === "Success" ? "OPEN_GATE_3000MS" : "DENY_ACCESS",
      },
      device: {
        model: "MN-SCAN-X1",
        firmware: "v2.4.1",
        ip: "10.0.12.54",
      },
    };

    setSelectedDetail({ id, payload, payloadPretty: JSON.stringify(payload, null, 2) });
  };

  const closeDetail = () => setSelectedDetail(null);

  const copyPayload = async () => {
    if (!selectedDetail) return;
    try {
      await navigator.clipboard.writeText(selectedDetail.payloadPretty);
    } catch {
      // Fallback for older browsers / blocked permissions
      const textarea = document.createElement("textarea");
      textarea.value = selectedDetail.payloadPretty;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const downloadPayload = () => {
    if (!selectedDetail) return;
    const blob = new Blob([selectedDetail.payloadPretty], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedDetail.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <StaffPortalShell
      headerMode="search"
      systemStatus={{ label: "SYSTEM LIVE", tone: "green" }}
      searchPlaceholder="Tìm kiếm giao dịch, ticket code..."
    >
      <div className="w-full max-w-[1400px] space-y-6">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium leading-4">
              <span className="text-slate-500">Staff Portal</span>
              <span className="h-1.5 w-1 rounded-full bg-slate-500" aria-hidden="true" />
              <span className="text-blue-600">Nhật ký giao dịch</span>
            </div>
            <h1 className="text-3xl font-bold leading-9 text-slate-900">Nhật ký giao dịch</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 outline outline-1 outline-offset-[-1px] outline-slate-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <span className="text-sm font-semibold leading-5 text-slate-700">Auto refresh</span>
              <button
                type="button"
                onClick={() => setAutoRefresh((value) => !value)}
                className={`relative h-6 w-10 rounded-full transition ${
                  autoRefresh ? "bg-blue-600" : "bg-slate-200"
                }`}
                aria-label="Toggle auto refresh"
              >
                <span
                  className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition ${
                    autoRefresh ? "left-[18px]" : "left-[2px]"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded bg-slate-900" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="relative rounded-xl bg-white outline outline-1 outline-offset-[-1px] outline-slate-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-4">
            <div className="min-w-[12rem] space-y-1.5">
              <div className="text-[10px] font-bold uppercase leading-4 text-slate-400">Khoảng thời gian</div>
              <div className="relative">
                <input
                  className="w-full rounded-xl bg-slate-50 py-2 pl-9 pr-4 text-sm leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                  value={rangeLabel}
                  readOnly
                />
                <span
                  className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded bg-slate-400"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="min-w-[10rem] space-y-1.5">
              <div className="text-[10px] font-bold uppercase leading-4 text-slate-400">Ga</div>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-2 text-sm leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
              >
                <option value="all">Tất cả các ga</option>
                <option value="ben-thanh">Ga Bến Thành</option>
                <option value="suoi-tien">Ga Suối Tiên</option>
              </select>
            </div>

            <div className="min-w-[9rem] space-y-1.5">
              <div className="text-[10px] font-bold uppercase leading-4 text-slate-400">Cổng (Gate ID)</div>
              <select
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-2 text-sm leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
              >
                <option value="all">Tất cả cổng</option>
                <option value="A-01">A-01</option>
                <option value="A-02">A-02</option>
              </select>
            </div>

            <div className="min-w-[10rem] space-y-1.5">
              <div className="text-[10px] font-bold uppercase leading-4 text-slate-400">Kết quả</div>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-2 text-sm leading-5 text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="success">Success</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              type="button"
              className="rounded-xl bg-blue-600/10 px-4 py-2 text-sm font-bold leading-5 text-blue-600"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white outline outline-1 outline-offset-[-1px] outline-slate-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-[12rem_7rem_5rem_7rem_9rem_8rem_1fr] items-center gap-6 px-6 py-4">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Thời gian</span>
                <span className="h-2 w-1 rounded bg-slate-300" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ga</span>
                <span className="h-2 w-1 rounded bg-slate-300" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Cổng</span>
                <span className="h-2 w-1 rounded bg-slate-300" aria-hidden="true" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Hành động</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ticket code</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Kết quả</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Lý do</div>
            </div>
          </div>

          <div>
            {rows.map((row, index) => (
              <button
                key={`${row.ticketCode}-${index}`}
                type="button"
                onClick={() => openDetail(row)}
                className={`grid w-full grid-cols-[12rem_7rem_5rem_7rem_9rem_8rem_1fr] items-start gap-6 px-6 py-4 text-left transition hover:bg-slate-50 ${
                  index === 0 ? "" : "border-t border-slate-100"
                }`}
              >
                <div className="text-sm leading-5 text-slate-600">{row.time}</div>
                <div className="text-sm font-medium leading-5 text-slate-900">
                  {row.station.includes(" ") ? (
                    <span>
                      {row.station.split(" ").slice(0, 2).join(" ")}
                      <br />
                      {row.station.split(" ").slice(2).join(" ")}
                    </span>
                  ) : (
                    row.station
                  )}
                </div>
                <div className="text-sm font-medium leading-5 text-slate-900">{row.gate}</div>

                <div>
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                      actionBadgeClass[row.action]
                    }`}
                  >
                    {row.action}
                  </span>
                </div>

                <div className="font-mono text-sm font-medium leading-5 text-blue-600">
                  {row.ticketCode.slice(0, 8)}
                  <br />
                  {row.ticketCode.slice(8)}
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                      resultBadgeClass[row.result]
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        row.result === "Success" ? "bg-green-500" : "bg-red-500"
                      }`}
                      aria-hidden="true"
                    />
                    {row.result}
                  </span>
                </div>

                <div className="text-sm font-medium leading-5 text-slate-400">
                  {row.reason ? <span className="text-red-600">{row.reason}</span> : "—"}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="text-xs font-medium leading-4 text-slate-500">
              Showing 1 to 6 of 1,240 transactions
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 outline outline-1 outline-offset-[-1px] outline-slate-200"
                aria-label="Previous page"
              >
                <span className="h-1.5 w-1 rounded bg-slate-500" aria-hidden="true" />
              </button>

              <button type="button" className="h-8 w-8 rounded-md bg-blue-600 text-xs font-bold text-white">
                1
              </button>
              <button type="button" className="h-8 w-8 rounded-md text-xs font-bold text-slate-600">
                2
              </button>
              <button type="button" className="h-8 w-8 rounded-md text-xs font-bold text-slate-600">
                3
              </button>
              <span className="px-1 text-base leading-6 text-slate-400">...</span>
              <button type="button" className="h-8 w-8 rounded-md text-xs font-bold text-slate-600">
                42
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 outline outline-1 outline-offset-[-1px] outline-slate-200"
                aria-label="Next page"
              >
                <span className="h-1.5 w-1 rounded bg-slate-500" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {selectedDetail ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết Giao dịch"
            onClick={closeDetail}
          >
            <div
              className="w-[672px] max-w-[672px] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10">
                    <span className="h-4 w-5 rounded bg-blue-600" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-7 text-slate-900">
                      Chi tiết Giao dịch &amp; Raw Payload
                    </div>
                    <div className="text-xs font-normal leading-4 text-slate-500">
                      Transaction ID: {selectedDetail.id}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-full p-2 hover:bg-slate-50"
                  aria-label="Đóng"
                >
                  <span className="h-3.5 w-3.5 rounded bg-slate-400" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-col gap-4 overflow-hidden bg-slate-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-500">
                    JSON Payload
                  </div>

                  <button
                    type="button"
                    onClick={copyPayload}
                    className="flex items-center gap-1 rounded-lg px-2 py-1"
                  >
                    <span className="h-3 w-2.5 rounded bg-blue-600" aria-hidden="true" />
                    <span className="text-xs font-bold leading-4 text-blue-600">Sao chép</span>
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl bg-slate-900 p-4 outline outline-1 outline-offset-[-1px] outline-slate-800">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-5 text-green-400">
                    {selectedDetail.payloadPretty}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-xl px-4 py-2 text-sm font-bold leading-5 text-slate-600 outline outline-1 outline-offset-[-1px] outline-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={downloadPayload}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold leading-5 text-white"
                >
                  Tải xuống Log
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </StaffPortalShell>
  );
}
