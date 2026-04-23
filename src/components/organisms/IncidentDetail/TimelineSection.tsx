import React from "react";
import type { IncidentTimelineEvent } from "@features/incident/incidentTypes";

interface Props {
  events: IncidentTimelineEvent[];
}

export default function TimelineSection({ events }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900">Timeline hoạt động</h3>
      </div>
      
      <div className="p-6">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có hoạt động nào.</p>
        ) : (
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
            {events.map((evt, idx) => (
              <div key={evt.id} className="relative pl-6">
                {/* Dots indicator */}
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-orange-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                </span>
                
                {/* Content */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{evt.actorName}</span>
                  <span className="text-xs text-gray-400">{evt.timestamp}</span>
                </div>
                
                <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {evt.type === 'status_change' && evt.newStatus ? (
                    <p>
                      Thay đổi trạng thái thành <span className="font-bold text-orange-600">{evt.newStatus}</span>.
                      {evt.content && evt.content !== `Thay đổi trạng thái từ ${evt.oldStatus} thành ${evt.newStatus}.` && (
                         <span className="text-gray-600 ml-1">{evt.content}</span>
                      )}
                    </p>
                  ) : evt.type === 'assigned' ? (
                    <p>
                      Đã phân công cho <span className="font-bold text-blue-600">{evt.content.split(': ')[1] || 'Kỹ thuật viên'}</span>.
                    </p>
                  ) : (
                    <p>{evt.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
