import { TicketType } from "@features/ticketType/ticketTypeTypes";

interface Props {
  data: TicketType[];
  onEdit: (t: TicketType) => void;
  onDelete: (id: string) => void;
}

export default function TicketTypeList({ data, onEdit, onDelete }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 shadow-sm">
        <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p className="font-medium text-gray-500">Chưa có dữ liệu loại vé nào</p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="app-table-scroll">
        <table className="app-table border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-[15%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Mã loại</th>
              <th className="w-[20%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Tên loại vé</th>
              <th className="w-[15%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Hiệu lực</th>
              <th className="w-[15%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Giá niêm yết</th>
              <th className="w-[20%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Quy định</th>
              <th className="w-[10%] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Trạng thái</th>
              <th className="w-[5%] px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item, index) => {
              const hasId = Boolean(item.id);

              return (
                <tr key={item.id || `${item.code}-${index}`} className="group transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-600">
                      {item.code}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{item.name}</span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {item.validityDuration} {item.validityUnit === "hours" ? "giờ" : "ngày"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {item.price.toLocaleString("vi-VN")} VND
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <p className="line-clamp-2 max-w-[200px] text-sm text-gray-500" title={item.conditions}>
                      {item.conditions}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    {item.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-500">
                        Ngừng áp dụng
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-50 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Chỉnh sửa"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasId) onDelete(item.id);
                        }}
                        disabled={!hasId}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title={hasId ? "Xóa" : "Thiếu ID loại vé"}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
