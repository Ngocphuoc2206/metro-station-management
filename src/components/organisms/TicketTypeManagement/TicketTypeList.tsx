import { TicketType } from "@features/ticketType/ticketTypeTypes";

interface Props {
  data: TicketType[];
  onEdit: (t: TicketType) => void;
  onDelete: (id: string) => void;
}

export default function TicketTypeList({ data, onEdit, onDelete }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p className="text-gray-500 font-medium">Chưa có dữ liệu loại vé nào</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Mã Loại</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[20%]">Tên Loại Vé</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Hiệu Lực</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Giá Niêm Yết</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[20%]">Quy Định</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[10%]">Trạng Thái</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[5%] text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                {/* MÃ LOẠI */}
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {item.code}
                  </span>
                </td>
                
                {/* TÊN LOẠI VÉ */}
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-900">{item.name}</span>
                </td>

                {/* HIỆU LỰC */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {item.validityDuration} {item.validityUnit === "hours" ? "giờ" : "ngày"}
                  </span>
                </td>

                {/* GIÁ NIÊM YẾT */}
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.price.toLocaleString("vi-VN")} VND
                  </span>
                </td>

                {/* QUY ĐỊNH */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-500 line-clamp-2 max-w-[200px]" title={item.conditions}>
                    {item.conditions}
                  </p>
                </td>

                {/* TRẠNG THÁI */}
                <td className="px-6 py-4">
                  {item.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-200 text-gray-500 bg-gray-50">
                      Ngừng áp dụng
                    </span>
                  )}
                </td>

                {/* THAO TÁC */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
