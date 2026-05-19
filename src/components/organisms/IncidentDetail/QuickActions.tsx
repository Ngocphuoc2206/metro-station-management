import React from "react";
import type { IncidentStatus } from "@features/incident/incidentTypes";

interface Props {
  status: IncidentStatus;
  onUpdateStatus: (newStatus: IncidentStatus) => void;
  isLoading: boolean;
}

export default function QuickActions({
  status,
  onUpdateStatus,
  isLoading,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4">Hành động nhanh</h3>

      <div className="flex flex-col gap-3">
        {status === "Open" && (
          <div className="text-sm text-gray-500 italic bg-blue-50 p-3 rounded-xl text-center">
            Vui lòng chọn &quot;Người phụ trách&quot; ở mục trên để giao việc và
            chuyển sang trạng thái Assigned.
          </div>
        )}

        {status === "Assigned" && (
          <button
            disabled={isLoading}
            onClick={() => onUpdateStatus("InProgress")}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Bắt đầu xử lý (In Progress)
          </button>
        )}

        {status === "InProgress" && (
          <>
            <button
              disabled={isLoading}
              onClick={() => onUpdateStatus("Resolved")}
              className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Đánh dấu Hoàn thành
            </button>

            <button
              disabled={isLoading}
              onClick={() => onUpdateStatus("Escalated")}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Chuyển tiếp kỹ thuật
            </button>
          </>
        )}

        {status === "Escalated" && (
          <button
            disabled={isLoading}
            onClick={() => onUpdateStatus("InProgress")}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Tiếp tục xử lý (In Progress)
          </button>
        )}

        {status === "Resolved" && (
          <button
            disabled={isLoading}
            onClick={() => onUpdateStatus("Closed")}
            className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Xác nhận Đóng thẻ (Closed)
          </button>
        )}

        {status === "Closed" && (
          <div className="text-sm text-green-600 font-medium bg-green-50 p-3 rounded-xl text-center border border-green-100 flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Sự cố đã được đóng
          </div>
        )}
      </div>
    </div>
  );
}
