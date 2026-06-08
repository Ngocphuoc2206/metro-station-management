import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CircleAlert, Clock3, Loader2, QrCode, Search, Ticket, X } from "lucide-react";
import PassengerTicketQrModal from "@components/organisms/PassengerTicketQrModal/PassengerTicketQrModal";
import PassengerShell from "@components/templates/PassengerShell";
import { myTicketApi, myTicketErrorMessage } from "@features/myTicket/myTicketApi";
import { publicApi } from "@features/public/publicApi";
import type { StationDto } from "@features/public/publicTypes";
import type { MyTicketDto, QrTokenResult, TicketHistoryRow } from "@features/myTicket/myTicketTypes";
import { displayTicketTypeName } from "@utils/ticketTypeName";

const QR_TTL_FALLBACK_SECONDS = 600;
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const EXPLICIT_TIME_ZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const parseApiDate = (value: string) => {
  const trimmed = value.trim();
  const normalized =
    /\d{2}:\d{2}/.test(trimmed) && !EXPLICIT_TIME_ZONE_PATTERN.test(trimmed)
      ? `${trimmed.replace(" ", "T")}Z`
      : trimmed;
  return new Date(normalized);
};

const formatTime = (value?: string) => {
  if (!value) return "--";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { timeZone: VIETNAM_TIME_ZONE });
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { timeZone: VIETNAM_TIME_ZONE });
};

const ticketStatus = (value: string) => {
  const status = value.toUpperCase();
  if (["USED", "COMPLETED", "CONSUMED", "FINISHED", "CHECKED_OUT", "TAP_OUT", "EXITED"].some((item) => status.includes(item))) return "Đã dùng";
  if (["READY", "ACTIVE", "VALID", "IN_USE", "CHECKED_IN", "TAP_IN", "ENTERED"].some((item) => status.includes(item))) return "Chưa dùng";
  if (["EXPIRED", "INVALID", "CANCELLED", "INACTIVE"].some((item) => status.includes(item))) return "Hết hạn";
  return "Chưa dùng";
};

const typeName = (ticket: MyTicketDto) => {
  return displayTicketTypeName(ticket.ticketTypeName);
};

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
  const [stations, setStations] = useState<StationDto[]>([]);
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
    setLoading(true);

    Promise.all([
      myTicketApi.list(),
      publicApi.getStations().catch(() => [])
    ])
      .then(([ticketData, stationData]) => {
        if (active) {
          setTickets(ticketData);
          setStations(stationData);
        }
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

  const getStationName = useCallback((stationId?: string) => {
    if (!stationId) return "";
    const target = stations.find((s) => s.id === stationId);
    return target ? target.name : `Ga ${stationId}`;
  }, [stations]);

  const resolveRouteName = useCallback((ticket: MyTicketDto) => {
    if (ticket.routeName) return ticket.routeName;
    const fromName = getStationName(ticket.fromStationId || ticket.originStationName);
    const toName = getStationName(ticket.toStationId || ticket.destinationStationName);
    if (fromName || toName) {
      return [fromName, toName].filter(Boolean).join(" → ");
    }
    return "Không giới hạn chặng";
  }, [getStationName]);

  const visibleTickets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const status = ticketStatus(ticket.status);
      const type = typeName(ticket);
      const currentRouteName = resolveRouteName(ticket);
      const matchesQuery = !keyword ||
        `${ticket.code} ${currentRouteName} ${type}`.toLowerCase().includes(keyword);
      return matchesQuery && (!statusFilter || status === statusFilter) && (!typeFilter || type === typeFilter);
    });
  }, [query, statusFilter, tickets, typeFilter, resolveRouteName]);

  const stats = useMemo(() => ({
    total: tickets.length,
    unused: tickets.filter((ticket) => ticketStatus(ticket.status) === "Chưa dùng").length,
    used: tickets.filter((ticket) => ticketStatus(ticket.status) === "Đã dùng").length,
    expired: tickets.filter((ticket) => ticketStatus(ticket.status) === "Hết hạn").length,
  }), [tickets]);

  const statCards = [
    { label: "Tổng số vé", value: stats.total, color: "text-slate-900", icon: Ticket, iconTone: "bg-blue-50 text-blue-600" },
    { label: "Chưa dùng", value: stats.unused, color: "text-amber-600", icon: QrCode, iconTone: "bg-amber-50 text-amber-600" },
    { label: "Đã dùng", value: stats.used, color: "text-slate-600", icon: Archive, iconTone: "bg-slate-100 text-slate-600" },
    { label: "Hết hạn", value: stats.expired, color: "text-red-600", icon: Clock3, iconTone: "bg-red-50 text-red-600" },
  ];

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
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div>
            <p className="text-sm text-slate-500">Hành khách / Vé của tôi</p>
            <h1 className="mt-1 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">Vé của tôi</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl sm:mb-5 ${card.iconTone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-bold uppercase text-slate-500">{card.label}</p>
                  <p className={`mt-2 text-2xl font-black sm:text-3xl ${card.color}`}>{card.value}</p>
                </div>
              );
            })}
          </div>
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã vé hoặc chặng đi" className="h-11 w-full min-w-0 flex-1 rounded-xl border border-slate-200 px-3 sm:min-w-64" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 sm:w-auto">
              <option value="">Tất cả trạng thái</option><option>Chưa dùng</option><option>Đã dùng</option><option>Hết hạn</option>
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 sm:w-auto">
              <option value="">Tất cả loại vé</option><option>Vé lượt</option><option>Vé ngày</option><option>Vé tháng</option>
            </select>
            <button type="button" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 sm:w-auto">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </button>
          </section>
          {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
          {loading ? <p className="flex items-center justify-center gap-2 rounded-2xl bg-white p-10 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải vé</p> : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {visibleTickets.map((ticket) => {
                const currentStatus = ticketStatus(ticket.status);
                const isActive = ticket.status.toUpperCase() === "ACTIVE";
                const isUsed = currentStatus === "Đã dùng";
                
                return (
                  <article key={ticket.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className={`h-1.5 ${isActive ? "bg-green-500" : currentStatus === "Hết hạn" ? "bg-red-500" : isUsed ? "bg-slate-400" : "bg-amber-500"}`} />
                    <div className="space-y-4 p-5">
                      <div className="flex justify-between gap-2">
                        <span className="text-xs font-bold text-slate-400">#{ticket.code}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${currentStatus === "Chưa dùng" ? "bg-amber-50 text-amber-700" : isUsed ? "bg-slate-100 text-slate-700" : currentStatus === "Hết hạn" ? "bg-red-50 text-red-700" : "bg-slate-100"}`}>
                          {currentStatus}
                        </span>
                      </div>
                      
                      <div>
                        <p className="font-bold text-slate-900">{typeName(ticket)}</p>
                        <p className="mt-1 text-sm text-slate-600">{resolveRouteName(ticket)}</p>
                      </div>
                      
                      {/* ── ĐÃ SỬA ĐỔI TOÀN BỘ KHU VỰC THỜI GIAN HIỂN THỊ Ở ĐÂY ── */}
                      <div className="border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-500">
                        <p>Ngày mua: {formatDateTime(ticket.issuedAt)}</p>
                        
                        {isActive ? (
                          <>
                            <p className="text-green-600 font-medium">Giờ vào ga: {formatDateTime(ticket.activatedAt)}</p>
                            <p className="text-red-500 font-medium">Hạn rời ga: {formatDateTime(ticket.expiredAt)}</p>
                          </>
                        ) : isUsed ? (
                          <>
                            <p>Giờ vào ga: {formatDateTime(ticket.activatedAt)}</p>
                            <p className="text-slate-400 italic">Đã hoàn thành hành trình</p>
                          </>
                        ) : (
                          <>
                            <p className="text-amber-600 font-medium">Trạng thái: Chưa dùng</p>
                            {ticket.expiredAt && (
                              <p className="text-amber-600 font-medium">
                                Hạn sử dụng: Đến {formatDateTime(ticket.expiredAt)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 bg-slate-50 p-4 min-[420px]:flex-row">
                      {!isUsed && currentStatus !== "Hết hạn" ? (
                        <button type="button" onClick={() => openQr(ticket)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white"><QrCode className="h-4 w-4" />QR vào cổng</button>
                      ) : null}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => { setSelectedTicket(null); setDetailError(null); }}
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="ticket-detail-title" className="text-xl font-bold">Chi tiết vé</h2>
              <button
                type="button"
                onClick={() => { setSelectedTicket(null); setDetailError(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng chi tiết vé"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {detailLoading ? <p className="mt-8 text-sm text-slate-500">Đang tải chi tiết...</p> : null}
            {detailError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{detailError}</p> : null}
            {selectedTicket ? <div className="mt-6 space-y-4 text-sm">
              <p><span className="text-slate-500">Mã vé:</span> <strong>{selectedTicket.code}</strong></p>
              <p><span className="text-slate-500">Loại vé:</span> {typeName(selectedTicket)}</p>
              <p><span className="text-slate-500">Chặng:</span> {resolveRouteName(selectedTicket)}</p>
              {selectedTicket.orderId && <p><span className="text-slate-500">Mã đơn hàng:</span> {selectedTicket.orderId}</p>}
              <p><span className="text-slate-500">Trạng thái:</span> {ticketStatus(selectedTicket.status)}</p>
              
              <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-600">
                <p><span className="text-slate-500 font-normal">Thời gian mua:</span> {formatDateTime(selectedTicket.issuedAt)}</p>
                {selectedTicket.activatedAt && <p><span className="text-slate-500 font-normal">Thời gian vào ga:</span> {formatDateTime(selectedTicket.activatedAt)}</p>}
                {selectedTicket.usedAt && <p><span className="text-slate-500 font-normal">Thời gian ra ga:</span> {formatDateTime(selectedTicket.usedAt)}</p>}
                <p><span className="text-slate-500 font-normal">Thời gian hết hạn:</span> {formatDateTime(selectedTicket.expiredAt)}</p>
              </div>

              {ticketStatus(selectedTicket.status) !== "Đã dùng" && ticketStatus(selectedTicket.status) !== "Hết hạn" ? (
                <button
                  type="button"
                  onClick={() => {
                    const ticket = selectedTicket;
                    setSelectedTicket(null);
                    setDetailError(null);
                    openQr(ticket);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white"
                >
                  <QrCode className="h-4 w-4" />
                  Xem QR
                </button>
              ) : null}

              <h3 className="border-t border-slate-100 pt-5 font-bold">Lịch sử sử dụng vé</h3>
              {history.map((row) => <div key={row.id} className="rounded-xl bg-slate-50 p-3"><p className="font-semibold">{row.action || row.result || "Sử dụng vé"}</p><p className="text-slate-500">{formatTime(row.time)} - {row.stationName || getStationName(row.stationId) || "--"} - {row.gateCode || "--"}</p></div>)}
              {!history.length ? <p className="text-slate-500">Chưa có lịch sử sử dụng.</p> : null}
            </div> : null}
          </div>
        </div>
      )}

      {qrTicket ? (
        <PassengerTicketQrModal
          ticketCode={`#${qrTicket.code}`}
          qrImageUrl={qrImage}
          isRefreshing={qrLoading}
          error={qrError}
          countdown={`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
          onClose={() => setQrTicket(null)}
        />
      ) : null}
    </>
  );
}
