import { useEffect, useState } from "react";

interface Props {
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  isLoading: boolean;
}

export default function ShiftStatusCard({
  isCheckedIn,
  onCheckIn,
  onCheckOut,
  isLoading,
}: Props) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const day = days[date.getDay()];
    return `${day}, ${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-6">
          Trạng thái ca trực
        </h2>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Thời gian hiện tại
          </p>
          <div className="text-5xl font-black text-slate-800 tracking-tight font-mono mb-2">
            {time ? formatTime(time) : "--:--:--"}
          </div>
          <p className="text-sm text-gray-500 font-medium">
            {time ? formatDate(time) : "Đang tải..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          disabled={isCheckedIn || isLoading}
          onClick={onCheckIn}
          className={`flex flex-col items-center justify-center py-4 rounded-xl font-bold transition-all ${
            isCheckedIn
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
          }`}
        >
          <svg
            className="w-6 h-6 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Check-in (Vào ca)
        </button>

        <button
          disabled={!isCheckedIn || isLoading}
          onClick={onCheckOut}
          className={`flex flex-col items-center justify-center py-4 rounded-xl font-bold transition-all border-2 ${
            !isCheckedIn
              ? "border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed"
              : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <svg
            className="w-6 h-6 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Check-out (Ra ca)
        </button>
      </div>
    </div>
  );
}
