import { AuditLog, AuditAction, AuditResult } from "@features/auditLog/auditLogTypes";

interface Props {
  logs: AuditLog[];
}

export default function AuditLogTable({ logs }: Props) {
  
  const getActionStyles = (action: AuditAction) => {
    switch (action) {
      case "UPDATE": return "bg-blue-100 text-blue-700";
      case "CREATE": return "bg-emerald-100 text-emerald-700";
      case "DELETE": return "bg-red-100 text-red-700";
      case "LOGIN": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const renderResultBadge = (result: AuditResult) => {
    if (result === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wider">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          SUCCESS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-bold tracking-wider">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        FAILED
      </span>
    );
  };

  return (
    <div className="overflow-x-auto custom-scrollbar w-full">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Thời gian</th>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Người thực hiện</th>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Hành động</th>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-[200px]">Đối tượng</th>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Kết quả</th>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">IP Address</th>
            <th className="px-6 py-5 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest text-center whitespace-nowrap">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-5">
                <p className="text-sm font-semibold text-gray-900">{log.dateFormatted}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5">{log.timeFormatted}</p>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                    {log.actor.initials || <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{log.actor.username}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${getActionStyles(log.action)}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-6 py-5">
                <span className="text-sm font-semibold text-gray-700">{log.target}</span>
              </td>
              <td className="px-6 py-5">
                {renderResultBadge(log.result)}
              </td>
              <td className="px-6 py-5">
                <span className="text-sm font-medium text-blue-600/80">{log.ipAddress}</span>
              </td>
              <td className="px-6 py-5 text-center">
                <button 
                  onClick={() => alert(`JSON LOG CHI TIẾT (Theo Requirement Mockup):\n\n${JSON.stringify(log, null, 2)}`)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                  title="Xem chi tiết (Alert Demo)"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
             <tr>
               <td colSpan={7} className="px-6 py-10 text-center text-gray-400 font-medium">
                 Không tìm thấy nhật ký ảo nào với bộ lọc này.
               </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
