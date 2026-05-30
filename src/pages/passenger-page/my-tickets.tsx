import Head from "next/head";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, Loader2, QrCode, X } from "lucide-react";
import PassengerShell from "@components/templates/PassengerShell";
import { myTicketApi, myTicketErrorMessage } from "@features/myTicket/myTicketApi";
import type { MyTicketDto, QrTokenResult, TicketHistoryRow } from "@features/myTicket/myTicketTypes";

const QR_TTL_FALLBACK_SECONDS = 600;

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
};

const formatTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
};

const ticketStatus = (value: string) => {
  const status = value.toUpperCase();
  if (["USED", "COMPLETED", "CONSUMED", "FINISHED", "CHECKED_OUT", "TAP_OUT", "EXITED"].some((item) => status.includes(item))) return "Đã dùng";
  if (["READY", "ACTIVE", "VALID", "IN_USE", "CHECKED_IN", "TAP_IN", "ENTERED"].some((item) => status.includes(item))) return "Sẵn sàng sử dụng";
  if (["EXPIRED", "INVALID", "CANCELLED", "INACTIVE"].some((item) => status.includes(item))) return "Hết hạn";
  return "Chưa dùng";
};

const typeName = (ticket: MyTicketDto) => {
  const type = `${ticket.ticketTypeName} ${ticket.ticketTypeId ?? ""}`.toLowerCase();
  if (type.includes("month")) return "Vé tháng";
  if (type.includes("daily") || type.includes("day")) return "Vé ngày";
  if (type.includes("single")) return "Vé lượt";
  return ticket.ticketTypeName || "Vé lượt";
};

const routeName = (ticket: MyTicketDto) =>
  ticket.routeName ||
  [ticket.originStationName, ticket.destinationStationName].filter(Boolean).join(" - ") ||
  "Không giới hạn chặng";

const parseQrDate = (value?: string) => {
  if (!value) return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).getTime();
};

const resolveQrSeconds = (qrResult: QrTokenResult) => {
  if (qrResult.expiresAt) {
    const expiresAt = parseQrDate(qrResult.expiresAt);
    if (!Number.isNaN(expiresAt)) {
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    }
  }

  if (qrResult.createdAt) {
    const createdAt = parseQrDate(qrResult.createdAt);
    if (!Number.isNaN(createdAt)) {
      const expiresAt = createdAt + QR_TTL_FALLBACK_SECONDS * 1000;
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    }
  }

  if (typeof qrResult.ttlSeconds === "number" && Number.isFinite(qrResult.ttlSeconds) && qrResult.ttlSeconds > 0) {
    return Math.max(0, Math.floor(qrResult.ttlSeconds));
  }

  return QR_TTL_FALLBACK_SECONDS;
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<MyTicketDto[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<MyTicketDto | null>(null);
  const [history, setHistory] = useState<TicketHistoryRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [qrTicket, setQrTicket] = useState<MyTicketDto | null>(null);
  const [qr, setQr] = useState<QrTokenResult | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let active = true;
    myTicketApi.list()
      .then((data) => {
        if (active) setTickets(data);
      })
      .catch((requestError) => {
        if (active) setError(myTicketErrorMessage(requestError, "Không thể tải danh sách vé"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleTickets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const status = ticketStatus(ticket.status);
      const type = typeName(ticket);
      const matchesQuery = !keyword ||
        `${ticket.code} ${routeName(ticket)} ${type}`.toLowerCase().includes(keyword);
      return matchesQuery && (!statusFilter || status === statusFilter) && (!typeFilter || type === typeFilter);
    });
  }, [query, statusFilter, tickets, typeFilter]);

  const stats = useMemo(() => ({
    total: tickets.length,
    active: tickets.filter((ticket) => ticketStatus(ticket.status) === "Sẵn sàng sử dụng").length,
    unused: tickets.filter((ticket) => ticketStatus(ticket.status) === "Chưa dùng").length,
    used: tickets.filter((ticket) => ticketStatus(ticket.status) === "Đã dùng").length,
    expired: tickets.filter((ticket) => ticketStatus(ticket.status) === "Hết hạn").length,
  }), [tickets]);

  const openDetail = async (id: string) => {
    setSelectedTicket(tickets.find((ticket) => ticket.id === id) ?? null);
    setDetailLoading(true);
    setDetailError(null);
    setHistory([]);
    try {
      const [detail, usage] = await Promise.all([
        myTicketApi.getById(id),
        myTicketApi.getHistory(id),
      ]);
      setSelectedTicket(detail);
      setHistory(usage);
    } catch (requestError) {
      setDetailError(myTicketErrorMessage(requestError, "Không thể tải chi tiết vé"));
    } finally {
      setDetailLoading(false);
    }
  };

  const loadQr = useCallback(async (ticket: MyTicketDto, refresh = false) => {
    if (!refresh) {
      setQrTicket(ticket);
      setQr(null);
      setQrImage(null);
    }
    setQrError(null);
    setQrLoading(true);
    try {
      const response = await myTicketApi.createQrToken(ticket.id);
      if (!response.token) throw new Error("Backend không trả QR token.");
      let image = response.qrCodeUrl;
      if (!image) {
        const generator = await import("qrcode");
        image = await generator.toDataURL(response.token, { margin: 1, width: 220 });
      }
      setQr(response);
      setSeconds(resolveQrSeconds(response));
      setQrImage(image);
    } catch (requestError) {
      setQrError(myTicketErrorMessage(requestError, "Không thể tạo QR token"));
    } finally {
      setQrLoading(false);
    }
  }, []);

  const openQr = (ticket: MyTicketDto) => {
    void loadQr(ticket);
  };

  useEffect(() => {
    if (!qr) return;
    const timer = window.setInterval(() => {
      setSeconds((previous) => Math.max(previous - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [qr]);

  useEffect(() => {
    if (!qrTicket || !qr || seconds > 0 || qrLoading || qrError) return;
    void loadQr(qrTicket, true);
  }, [loadQr, qr, qrError, qrLoading, qrTicket, seconds]);

  return (
    <>
      <Head><title>Vé của tôi | MetroNext</title></Head>
      <PassengerShell>
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <p className="text-sm text-slate-500">Hành khách / Vé của tôi</p>
            <h1 className="mt-1 text-4xl font-black text-slate-900">Vé của tôi</h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Tổng số vé", stats.total, "text-slate-900"],
              ["Sẵn sàng sử dụng", stats.active, "text-green-600"],
              ["Chưa dùng", stats.unused, "text-amber-600"],
              ["Đã dùng", stats.used, "text-slate-600"],
              ["Hết hạn", stats.expired, "text-red-600"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <section className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã vé hoặc chặng đi" className="h-11 min-w-64 flex-1 rounded-xl border border-slate-200 px-3" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3">
              <option value="">Tất cả trạng thái</option><option>Sẵn sàng sử dụng</option><option>Chưa dùng</option><option>Đã dùng</option><option>Hết hạn</option>
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3">
              <option value="">Tất cả loại vé</option><option>Vé lượt</option><option>Vé ngày</option><option>Vé tháng</option>
            </select>
          </section>
          {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
          {loading ? <p className="flex items-center justify-center gap-2 rounded-2xl bg-white p-10 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải vé</p> : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {visibleTickets.map((ticket) => {
                const status = ticketStatus(ticket.status);
                const active = status === "Sẵn sàng sử dụng";
                return (
                  <article key={ticket.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className={`h-1.5 ${active ? "bg-green-500" : status === "Hết hạn" ? "bg-red-500" : status === "Đã dùng" ? "bg-slate-400" : "bg-amber-500"}`} />
                    <div className="space-y-4 p-5">
                      <div className="flex justify-between gap-2">
                        <span className="text-xs font-bold text-slate-400">#{ticket.code}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{status}</span>
                      </div>
                      <div><p className="font-bold text-slate-900">{typeName(ticket)}</p><p className="mt-1 text-sm text-slate-600">{routeName(ticket)}</p></div>
                      <p className="border-t border-slate-100 pt-3 text-sm text-slate-600">Hiệu lực: {formatDate(ticket.validFrom)} - {formatDate(ticket.validTo)}</p>
                    </div>
                    <div className="flex gap-2 bg-slate-50 p-4">
                      <button type="button" onClick={() => openQr(ticket)} disabled={!active} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white disabled:bg-slate-300"><QrCode className="h-4 w-4" />QR</button>
                      <button type="button" onClick={() => openDetail(ticket.id)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Chi tiết</button>
                    </div>
                  </article>
                );
              })}
              {!visibleTickets.length ? <div className="col-span-full rounded-2xl bg-white p-10 text-center text-sm text-slate-500"><CircleAlert className="mx-auto mb-2 h-8 w-8" />Không có vé phù hợp.</div> : null}
            </div>
          )}
        </div>
      </PassengerShell>

      {(selectedTicket || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
          <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Chi tiết vé</h2><button onClick={() => { setSelectedTicket(null); setDetailError(null); }}><X /></button></div>
            {detailLoading ? <p className="mt-8 text-sm text-slate-500">Đang tải chi tiết...</p> : null}
            {detailError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{detailError}</p> : null}
            {selectedTicket ? <div className="mt-6 space-y-4 text-sm">
              <p><span className="text-slate-500">Mã vé:</span> <strong>{selectedTicket.code}</strong></p>
              <p><span className="text-slate-500">Loại vé:</span> {typeName(selectedTicket)}</p>
              <p><span className="text-slate-500">Chặng:</span> {routeName(selectedTicket)}</p>
              <p><span className="text-slate-500">Trạng thái:</span> {ticketStatus(selectedTicket.status)}</p>
              <h3 className="border-t border-slate-100 pt-5 font-bold">Lịch sử sử dụng vé</h3>
              {history.map((row) => <div key={row.id} className="rounded-xl bg-slate-50 p-3"><p className="font-semibold">{row.action || row.result || "Sử dụng vé"}</p><p className="text-slate-500">{formatTime(row.time)} - {row.stationName || row.stationId || "--"} - {row.gateCode || "--"}</p></div>)}
              {!history.length ? <p className="text-slate-500">Chưa có lịch sử sử dụng.</p> : null}
            </div> : null}
          </aside>
        </div>
      )}

      {qrTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <div className="flex justify-between"><h2 className="text-lg font-bold">Mã QR vào cổng</h2><button onClick={() => setQrTicket(null)}><X className="h-5 w-5" /></button></div>
            <div className="my-6 flex h-56 items-center justify-center rounded-xl border border-slate-200">
              {qrImage ? <Image src={qrImage} width={220} height={220} unoptimized alt="QR vé động" className={qrLoading ? "opacity-40" : ""} /> : qrError ? <p className="px-4 text-sm text-red-600">{qrError}</p> : <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            </div>
            <p className="font-bold text-blue-600">#{qrTicket.code}</p>
            {qr ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{qrLoading ? "Đang đổi mã QR..." : <>Đổi mã mới sau {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</>}</p> : null}
          </div>
        </div>
      )}
    </>
  );
}
