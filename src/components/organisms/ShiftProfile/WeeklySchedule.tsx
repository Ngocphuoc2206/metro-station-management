import type { ShiftSchedule } from "@features/shift/shiftTypes";

interface Props {
  schedule: ShiftSchedule[];
  isLoading: boolean;
}

export default function WeeklySchedule({ schedule, isLoading }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-gray-900">Lịch trực tuần này</h2>
        <div className="flex bg-gray-50 rounded-lg p-1">
          <button className="px-3 py-1 rounded hover:bg-white hover:shadow-sm transition-all">&lt;</button>
          <button className="px-3 py-1 rounded hover:bg-white hover:shadow-sm transition-all">&gt;</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto pb-2">
        <div className="flex min-w-[600px] w-full border border-gray-100 rounded-xl overflow-hidden divide-x divide-gray-100">
          {isLoading ? (
            <div className="w-full flex items-center justify-center py-10 text-gray-400">Đang tải lịch biểu...</div>
          ) : (
            schedule.map((day, idx) => {
              const isToday = day.status === "in_progress"; // Ví dụ, in_progress đang đại diện cho ca ngày hôm nay trong mock
              const isOff = day.shiftType === "off";

              return (
                <div key={idx} className={`flex-1 flex flex-col ${isToday ? "bg-blue-50/50" : "bg-white"}`}>
                  {/* Header: Thứ */}
                  <div className={`py-3 text-center border-b border-gray-100 ${isToday ? "bg-blue-50" : ""}`}>
                    <p className={`text-xs font-semibold ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                      {day.dayOfWeek}
                    </p>
                  </div>
                  
                  {/* Ngày */}
                  <div className="p-3 pb-2 text-sm font-semibold text-gray-900">
                    {day.date.split("-")[2]}
                  </div>

                  {/* Block Ca */}
                  <div className="px-3 pb-4 flex-1">
                    {isOff ? (
                      <div className="h-full border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center p-2">
                        <p className="text-xs font-semibold text-gray-400">Nghỉ (OFF)</p>
                        <svg className="w-5 h-5 text-gray-300 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`h-full rounded-lg p-2.5 flex flex-col justify-center border transition-all ${
                        isToday 
                          ? "bg-blue-600 border-blue-500 shadow-md shadow-blue-200" 
                          : "bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                      }`}>
                        <p className={`text-xs font-bold mb-1 ${isToday ? "text-white" : "text-gray-900"}`}>
                          Ca {day.shiftType === "morning" ? "Sáng" : "Chiều"}
                        </p>
                        <p className={`text-[10px] font-medium leading-tight ${isToday ? "text-blue-100" : "text-gray-500"}`}>
                          {day.startTime} -<br/>{day.endTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
