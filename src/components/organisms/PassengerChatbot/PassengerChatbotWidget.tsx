import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  BotMessageSquare,
  Clock3,
  History,
  Minimize2,
  Send,
  Sparkles,
  Ticket,
  TrainFront,
  X,
} from "lucide-react";
import { publicApi } from "@features/public/publicApi";
import type { RouteDto, StationDto } from "@features/public/publicTypes";
import { scheduleApi } from "@features/schedule/scheduleApi";
import type { ScheduleDto } from "@features/schedule/scheduleTypes";
import { myTicketApi } from "@features/myTicket/myTicketApi";
import type { MyTicketDto } from "@features/myTicket/myTicketTypes";
import { tripApi } from "@features/trip/tripApi";
import type { TripDto } from "@features/trip/tripTypes";

type ChatAction = {
  label: string;
  href: string;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  content: string;
  actions?: ChatAction[];
};

type ChatContext = {
  routes: RouteDto[];
  stations: StationDto[];
  schedules: ScheduleDto[];
  tickets: MyTicketDto[];
  trips: TripDto[];
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "bot",
    content:
      "Xin chào, mình là trợ lý MetroNext. Bạn có thể hỏi mình về lịch tàu, vé đang có, lịch sử chuyến, ga hoặc bản đồ live.",
    actions: [
      { label: "Mua vé", href: "/passenger-page/buy-tickets-step-1" },
      { label: "Lịch tàu", href: "/passenger-page/schedule" },
    ],
  },
];

const quickPrompts = [
  "Chuyến tiếp theo mấy giờ?",
  "Vé của tôi còn hiệu lực không?",
  "Mở bản đồ live",
  "Tôi muốn mua vé",
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatTime = (value?: string) => {
  if (!value) return "--";
  const [hours = "", minutes = ""] = value.split(":");
  return hours && minutes ? `${hours}:${minutes}` : value;
};

const parseTimeToSeconds = (value: string) => {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  return Number.isFinite(total) ? total : null;
};

const getNextArrivalTime = (schedule: ScheduleDto, now = new Date()) => {
  const baseArrivalSeconds = parseTimeToSeconds(schedule.arrivalTime);
  if (baseArrivalSeconds === null) return formatTime(schedule.arrivalTime);

  const frequencySeconds = Math.max(1, schedule.frequencyMinutes || 1) * 60;
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let nextArrivalSeconds = baseArrivalSeconds;

  if (nowSeconds > baseArrivalSeconds) {
    const elapsed = nowSeconds - baseArrivalSeconds;
    nextArrivalSeconds = baseArrivalSeconds + Math.ceil(elapsed / frequencySeconds) * frequencySeconds;
  }

  const normalized = ((nextArrivalSeconds % 86400) + 86400) % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const statusLabel = (status?: string) => {
  const normalized = normalizeText(status ?? "");
  if (normalized.includes("active") || normalized.includes("valid")) return "đang hoạt động";
  if (normalized.includes("used")) return "đã sử dụng";
  if (normalized.includes("expired")) return "hết hạn";
  if (normalized.includes("delay")) return "trễ";
  if (normalized.includes("inactive")) return "tạm ngưng";
  return status || "chưa rõ trạng thái";
};

const directionLabel = (direction: string) => {
  if (direction === "OUTBOUND") return "chiều đi";
  if (direction === "INBOUND") return "chiều về";
  return direction || "chưa rõ hướng";
};

const findMentionedStation = (message: string, stations: StationDto[]) => {
  const normalizedMessage = normalizeText(message);
  return stations.find((station) => normalizedMessage.includes(normalizeText(station.name)));
};

const routeName = (routeId: string, routes: RouteDto[]) =>
  routes.find((route) => route.id === routeId)?.name ?? `Tuyến ${routeId}`;

const stationName = (stationId: string, stations: StationDto[]) =>
  stations.find((station) => station.id === stationId)?.name ?? stationId;

const buildScheduleReply = (message: string, context: ChatContext): ChatMessage => {
  const station = findMentionedStation(message, context.stations);
  const activeSchedules = context.schedules
    .filter((item) => item.status !== "INACTIVE")
    .filter((item) => !station || item.stationId === station.id)
    .slice(0, 3);

  if (!activeSchedules.length) {
    return {
      id: crypto.randomUUID(),
      role: "bot",
      content: station
        ? `Mình chưa thấy lịch tàu phù hợp cho ${station.name}. Bạn có thể mở trang lịch tàu để lọc chi tiết hơn.`
        : "Mình chưa thấy lịch tàu phù hợp ở dữ liệu hiện tại. Bạn có thể mở trang lịch tàu để kiểm tra lại.",
      actions: [{ label: "Xem lịch tàu", href: "/passenger-page/schedule" }],
    };
  }

  const lines = activeSchedules.map((schedule) => {
    const nextArrival = getNextArrivalTime(schedule);
    return `${routeName(schedule.routeId, context.routes)} tại ${stationName(schedule.stationId, context.stations)}: đến dự kiến ${nextArrival}, khởi hành ${formatTime(schedule.departureTime)}, ${directionLabel(schedule.direction)}, ${statusLabel(schedule.status)}.`;
  });

  return {
    id: crypto.randomUUID(),
    role: "bot",
    content: `Mình tìm thấy ${activeSchedules.length} lịch gần nhất:\n${lines.join("\n")}`,
    actions: [
      { label: "Xem lịch tàu", href: "/passenger-page/schedule" },
      { label: "Bản đồ live", href: "/passenger-page/live-map" },
    ],
  };
};

const buildTicketReply = (tickets: MyTicketDto[]): ChatMessage => {
  const activeTickets = tickets.filter((ticket) => {
    const normalized = normalizeText(ticket.status);
    return normalized.includes("active") || normalized.includes("valid");
  });
  const sample = activeTickets[0] ?? tickets[0];

  if (!sample) {
    return {
      id: crypto.randomUUID(),
      role: "bot",
      content: "Bạn chưa có vé nào trong tài khoản. Mình có thể đưa bạn sang màn mua vé ngay.",
      actions: [{ label: "Mua vé", href: "/passenger-page/buy-tickets-step-1" }],
    };
  }

  const price = sample.price ? `, giá ${sample.price.toLocaleString("vi-VN")}đ` : "";
  const route = sample.routeName ? ` trên ${sample.routeName}` : "";
  const validTo = sample.validTo ? `, hiệu lực đến ${sample.validTo}` : "";

  return {
    id: crypto.randomUUID(),
    role: "bot",
    content: `Bạn có ${activeTickets.length || tickets.length} vé trong tài khoản. Vé gần nhất là ${sample.ticketTypeName || sample.code}${route}, trạng thái ${statusLabel(sample.status)}${validTo}${price}.`,
    actions: [{ label: "Vé của tôi", href: "/passenger-page/my-tickets" }],
  };
};

const buildTripReply = (trips: TripDto[]): ChatMessage => {
  const recentTrip = trips[0];
  if (!recentTrip) {
    return {
      id: crypto.randomUUID(),
      role: "bot",
      content: "Mình chưa thấy lịch sử chuyến nào. Khi bạn quét vé vào/ra ga, chuyến gần nhất sẽ xuất hiện ở đây.",
      actions: [{ label: "Lịch sử chuyến", href: "/passenger-page/history" }],
    };
  }

  return {
    id: crypto.randomUUID(),
    role: "bot",
    content: `Chuyến gần nhất của bạn: ${recentTrip.originStationName || "Ga vào"} → ${recentTrip.destinationStationName || "Ga ra"}, vé ${recentTrip.ticketCode || recentTrip.ticketId}, trạng thái ${statusLabel(recentTrip.status)}.`,
    actions: [{ label: "Lịch sử chuyến", href: "/passenger-page/history" }],
  };
};

const buildStationReply = (message: string, stations: StationDto[]): ChatMessage => {
  const station = findMentionedStation(message, stations);
  if (station) {
    return {
      id: crypto.randomUUID(),
      role: "bot",
      content: `${station.name} có trong hệ thống MetroNext. Bạn có thể xem lịch tàu hoặc bản đồ live để kiểm tra chuyến đang chạy qua ga này.`,
      actions: [
        { label: "Lịch tàu", href: "/passenger-page/schedule" },
        { label: "Bản đồ live", href: "/passenger-page/live-map" },
      ],
    };
  }

  const names = stations.slice(0, 5).map((item) => item.name).join(", ");
  return {
    id: crypto.randomUUID(),
    role: "bot",
    content: names
      ? `Một vài ga hiện có: ${names}. Bạn hãy hỏi rõ tên ga, ví dụ "Lịch tàu ở Ga Bến Thành".`
      : "Mình chưa tải được danh sách ga. Bạn thử mở lại trang lịch tàu hoặc bản đồ live nhé.",
    actions: [{ label: "Bản đồ live", href: "/passenger-page/live-map" }],
  };
};

const buildFallbackReply = (): ChatMessage => ({
  id: crypto.randomUUID(),
  role: "bot",
  content:
    "Mình hiểu tốt nhất các câu hỏi về lịch tàu, vé, lịch sử chuyến, ga và bản đồ live. Bạn có thể hỏi kiểu: “Chuyến tiếp theo mấy giờ?” hoặc “Vé của tôi còn hiệu lực không?”.",
  actions: [
    { label: "Mua vé", href: "/passenger-page/buy-tickets-step-1" },
    { label: "Lịch tàu", href: "/passenger-page/schedule" },
  ],
});

export default function PassengerChatbotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showLauncherGreeting, setShowLauncherGreeting] = useState(true);
  const [context, setContext] = useState<ChatContext | null>(null);
  const contextPromiseRef = useRef<Promise<ChatContext> | null>(null);

  const unreadLabel = useMemo(() => (isOpen ? "Thu nhỏ trợ lý" : "Mở trợ lý MetroNext"), [isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLauncherGreeting(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  const loadContext = async () => {
    if (context) return context;
    if (contextPromiseRef.current) return contextPromiseRef.current;

    contextPromiseRef.current = Promise.allSettled([
      publicApi.getRoutes(),
      publicApi.getStations(),
      scheduleApi.list(),
      myTicketApi.list(),
      tripApi.list({ page: 0, limit: 5 }),
    ]).then((results) => {
      const loadedContext: ChatContext = {
        routes: results[0].status === "fulfilled" ? results[0].value : [],
        stations: results[1].status === "fulfilled" ? results[1].value : [],
        schedules: results[2].status === "fulfilled" ? results[2].value : [],
        tickets: results[3].status === "fulfilled" ? results[3].value : [],
        trips: results[4].status === "fulfilled" ? results[4].value.items : [],
      };
      setContext(loadedContext);
      return loadedContext;
    });

    return contextPromiseRef.current;
  };

  const answerMessage = async (rawMessage: string) => {
    const loadedContext = await loadContext();
    const normalized = normalizeText(rawMessage);

    if (normalized.includes("mua") || normalized.includes("thanh toan") || normalized.includes("gia ve")) {
      return {
        id: crypto.randomUUID(),
        role: "bot",
        content: "Bạn có thể mua vé mới từ màn Mua vé. Nếu vừa thanh toán xong, dashboard sẽ cập nhật vé và chi phí sau khi giao dịch hoàn tất.",
        actions: [{ label: "Mua vé", href: "/passenger-page/buy-tickets-step-1" }],
      } satisfies ChatMessage;
    }

    if (normalized.includes("ban do") || normalized.includes("live") || normalized.includes("vi tri tau")) {
      return {
        id: crypto.randomUUID(),
        role: "bot",
        content: "Bản đồ live hiển thị vị trí tàu và trạng thái ga theo dữ liệu đang có. Mình mở nhanh cho bạn nhé.",
        actions: [{ label: "Mở bản đồ live", href: "/passenger-page/live-map" }],
      } satisfies ChatMessage;
    }

    if (normalized.includes("ve") || normalized.includes("ticket") || normalized.includes("hieu luc")) {
      return buildTicketReply(loadedContext.tickets);
    }

    if (normalized.includes("lich su") || normalized.includes("chuyen gan") || normalized.includes("da di")) {
      return buildTripReply(loadedContext.trips);
    }

    if (normalized.includes("lich") || normalized.includes("gio") || normalized.includes("tau") || normalized.includes("chuyen tiep")) {
      return buildScheduleReply(rawMessage, loadedContext);
    }

    if (normalized.includes("ga") || normalized.includes("tram") || normalized.includes("station")) {
      return buildStationReply(rawMessage, loadedContext.stations);
    }

    return buildFallbackReply();
  };

  const sendMessage = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isThinking) return;

    setIsOpen(true);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setIsThinking(true);

    try {
      const reply = await answerMessage(trimmed);
      setMessages((current) => [...current, reply]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: "Mình chưa lấy được dữ liệu lúc này. Bạn thử lại sau vài giây hoặc mở trực tiếp trang cần xem nhé.",
          actions: [
            { label: "Lịch tàu", href: "/passenger-page/schedule" },
            { label: "Vé của tôi", href: "/passenger-page/my-tickets" },
          ],
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const goTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const legacyLauncherLabel = false;

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-16 sm:right-5">
      <style jsx global>{`
        @keyframes metroChatPop {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes metroChatFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes metroChatPulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        .metro-chat-panel {
          animation: metroChatPop 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-origin: bottom right;
        }

        .metro-chat-launcher {
          animation: metroChatFloat 3s ease-in-out infinite;
        }

        .metro-chat-launcher:hover {
          animation-play-state: paused;
        }

        .metro-chat-pulse {
          animation: metroChatPulse 1.8s ease-in-out infinite;
        }
      `}</style>
      {isOpen ? (
        <section className="metro-chat-panel flex h-[min(580px,calc(100vh-6rem))] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.35rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/20">
          <header className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg shadow-blue-900/15">
                <BotMessageSquare className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Trợ lý MetroNext</h2>
                <p className="text-xs text-slate-300">Lịch tàu, vé, bản đồ live</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                aria-label="Thu nhỏ chatbot"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                aria-label="Xóa hội thoại"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-blue-50/70 via-slate-50 to-white px-3.5 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "bot" ? (
                  <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                    <BotMessageSquare className="h-3.5 w-3.5" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "rounded-bl-md border border-blue-100 bg-white text-slate-800 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  {message.actions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={`${message.id}-${action.href}`}
                          type="button"
                          onClick={() => goTo(action.href)}
                          className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isThinking ? (
              <div className="flex items-end gap-2">
                <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                  <BotMessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-blue-100 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-500 shadow-sm">
                  <Sparkles className="metro-chat-pulse h-4 w-4 text-blue-500" />
                  Đang kiểm tra dữ liệu...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-blue-100 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                placeholder="Hỏi về lịch tàu, vé, ga..."
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {!isOpen ? (
        <div className="flex items-end gap-2">
          {showLauncherGreeting ? (
            <button
              type="button"
              onClick={() => {
                setShowLauncherGreeting(false);
                setIsOpen(true);
              }}
              className="metro-chat-panel relative mb-1 max-w-[230px] rounded-2xl rounded-br-md border border-blue-100 bg-white px-4 py-3 text-left text-sm font-semibold leading-5 text-slate-800 shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-blue-900/15 focus:outline-none focus:ring-4 focus:ring-blue-100 after:absolute after:-right-1.5 after:bottom-4 after:h-3 after:w-3 after:rotate-45 after:border-r after:border-t after:border-blue-100 after:bg-white"
            >
              Xin chào! Cần mình hỗ trợ gì?
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setShowLauncherGreeting(false);
              setIsOpen(true);
            }}
            className="metro-chat-launcher group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 [&>span:last-child]:hidden"
            aria-label={unreadLabel}
          >
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <BotMessageSquare className="h-6 w-6" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-blue-600 bg-emerald-400" />
            </span>
            {legacyLauncherLabel ? <span className="hidden text-sm sm:inline">Tro ly</span> : null}
            <span className="hidden text-sm sm:inline">Trợ lý</span>
          </button>
        </div>
      ) : null}

      {!isOpen ? (
        <div className="hidden">
          <div className="mb-2 flex items-center gap-2 font-bold text-slate-900">
            <TrainFront className="h-4 w-4 text-blue-600" />
            Cần hỗ trợ chuyến đi?
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => sendMessage("Lịch tàu")} className="rounded-xl bg-slate-50 p-2 text-center font-semibold hover:bg-blue-50 hover:text-blue-600">
              <Clock3 className="mx-auto mb-1 h-4 w-4" />
              Lịch
            </button>
            <button type="button" onClick={() => sendMessage("Vé của tôi")} className="rounded-xl bg-slate-50 p-2 text-center font-semibold hover:bg-blue-50 hover:text-blue-600">
              <Ticket className="mx-auto mb-1 h-4 w-4" />
              Vé
            </button>
            <button type="button" onClick={() => sendMessage("Lịch sử chuyến")} className="rounded-xl bg-slate-50 p-2 text-center font-semibold hover:bg-blue-50 hover:text-blue-600">
              <History className="mx-auto mb-1 h-4 w-4" />
              Chuyến
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
