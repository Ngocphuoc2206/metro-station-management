import { Route } from "@features/route/routeTypes";

interface Props {
  routes: Route[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

export default function RouteList({ routes, selectedId, onSelect, onEditClick, onDeleteClick }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Danh sách tuyến</h3>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {routes.length} Tuyến
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {routes.map((route) => {
          const isSelected = selectedId === route.id;
          
          let statusLabel = "Đang hoạt động";
          let statusClasses = "text-emerald-700 bg-emerald-50";
          if (route.status === "inactive") {
            statusLabel = "Tạm dừng";
            statusClasses = "text-orange-700 bg-orange-50";
          } else if (route.status === "maintenance") {
            statusLabel = "Dự án";
            statusClasses = "text-blue-700 bg-blue-50";
          }

          return (
            <div
              key={route.id}
              onClick={() => onSelect(route.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center bg-white ${
                isSelected ? "border-blue-500 shadow-md transform -translate-y-0.5" : "border-transparent shadow-sm hover:shadow hover:border-gray-200"
              }`}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: route.color }}
              />
              <div className="w-full flex justify-between items-start pl-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-[15px] mb-0.5">{route.name}</h4>
                  <p className="text-sm text-gray-500 mb-3">{route.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide">
                      {route.stationsCount} Ga
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${statusClasses}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Chỉnh sửa tuyến"
                    className={`p-2 rounded-full transition-colors ${
                      isSelected ? "text-blue-600 hover:bg-blue-50" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(route.id);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Xóa tuyến"
                    className="p-2 rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(route.id);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3 0V5a2 2 0 012-2h0a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
