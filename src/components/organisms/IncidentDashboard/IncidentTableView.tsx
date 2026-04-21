import React from "react";
import type { IncidentRecord } from "@features/incident/incidentTypes";

interface Props {
  incidents: IncidentRecord[];
}

export default function IncidentTableView({ incidents }: Props) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="bg-red-50 text-red-600 font-bold text-[10px] px-2 py-1 rounded-md uppercase">Nguy cấp</span>;
      case "warning":
        return <span className="bg-orange-50 text-orange-600 font-bold text-[10px] px-2 py-1 rounded-md uppercase">Cảnh báo</span>;
      case "low":
        return <span className="bg-green-50 text-green-600 font-bold text-[10px] px-2 py-1 rounded-md uppercase">Thấp</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
      case "Assigned":
        return <span className="bg-gray-100 text-gray-700 font-bold text-xs px-3 py-1 rounded-full border border-gray-200/60">Mới mở</span>;
      case "InProgress":
      case "Escalated":
        return <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full border border-blue-200/60">Đang xử lý</span>;
      case "Resolved":
        return <span className="bg-green-50 text-green-700 font-bold text-xs px-3 py-1 rounded-full border border-green-200/60">Đã xử lý</span>;
      case "Closed":
        return <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full border border-slate-200/60">Đã đóng</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-2xl">Mã Sự Cố (ID)</th>
              <th className="px-6 py-4">Mức độ</th>
              <th className="px-6 py-4">Nội dung</th>
              <th className="px-6 py-4">Nhà ga / Thiết bị</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right rounded-tr-2xl">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {incidents.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium">Không tìm thấy sự cố nào.</td>
               </tr>
            ) : null}
            {incidents.map(incident => (
              <tr key={incident.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5 font-bold text-gray-900 w-32">
                  <div className="whitespace-pre-line">{incident.id.replace("-", "-\n")}</div>
                </td>
                <td className="px-6 py-5 w-24">
                  {getSeverityBadge(incident.severity)}
                </td>
                <td className="px-6 py-5 max-w-md w-full">
                  <span className="font-semibold text-gray-700">{incident.title}</span>
                  {incident.assigneeName && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {incident.assigneeName}
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 w-40">
                  <div className="font-medium text-gray-600 text-xs mb-1">{incident.stationId}</div>
                  <div className="font-bold text-gray-400 text-[10px] uppercase border inline-block px-1.5 rounded">{incident.deviceType}</div>
                </td>
                <td className="px-6 py-5 text-center w-36">
                  {getStatusBadge(incident.status)}
                </td>
                <td className="px-6 py-5 text-right w-24">
                  <button className="font-bold text-sm text-blue-600 hover:text-blue-800">
                    Cập nhật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
