import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Route } from "@features/route/routeTypes";
import { stationApi } from "@features/station/stationApi";

const schema = z.object({
  name: z.string().min(2, "Tên tuyến phải có ít nhất 2 ký tự"),
  routeCode: z.string().min(1, "Vui lòng nhập mã tuyến (VD: CL-HD)"),
  color: z.string().min(4, "Vui lòng chọn màu nhận diện"),
  status: z.enum(["active", "inactive", "maintenance"]),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface SelectedStation {
  stationId: string;
  stationName: string;
  travelTimeNext: number;
  distanceNext: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  route?: Route | null;
  onSubmit: (data: FormData & { stations: SelectedStation[] }) => Promise<void>;
}

const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#f97316", // orange
  "#a855f7", // purple
  "#eab308", // yellow
];

export default function RouteFormModal({ isOpen, onClose, route, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      routeCode: "",
      color: COLORS[0],
      status: "active",
      description: "",
    },
  });

  // ── Station picker state ───────────────────────────────────────────────────
  const [availableStations, setAvailableStations] = useState<{ id: string; name: string }[]>([]);
  const [selectedStations, setSelectedStations] = useState<SelectedStation[]>([]);
  const [stationSearch, setStationSearch] = useState("");
  const [loadingStations, setLoadingStations] = useState(false);

  // Fetch stations when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingStations(true);
    // Lấy tất cả ga đang hoạt động (active), limit 200 để có đủ dữ liệu
    stationApi.getStations({ status: "active" }, 1, 200)
      .then((result) => {
        setAvailableStations(result.data.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(console.error)
      .finally(() => setLoadingStations(false));
  }, [isOpen]);

  // Reset form & stations when modal opens
  useEffect(() => {
    if (isOpen) {
      if (route) {
        reset({
          name: route.name,
          routeCode: route.routeCode ?? "",
          color: route.color,
          status: route.status,
          description: route.description,
        });
        // Pre-fill stations for edit mode
        const existing: SelectedStation[] = (route.stations ?? []).map((s) => ({
          stationId: s.stationId,
          stationName: s.stationName,
          travelTimeNext: s.travelTimeNext ?? 0,
          distanceNext: s.distanceNext ?? 0,
        }));
        setSelectedStations(existing);
      } else {
        reset({ name: "", routeCode: "", color: COLORS[0], status: "active", description: "" });
        setSelectedStations([]);
      }
      setStationSearch("");
    }
  }, [isOpen, reset, route]);

  if (!isOpen) return null;

  const selectedColor = watch("color");
  const isEdit = !!route;

  // Add station to list
  const addStation = (id: string, name: string) => {
    if (selectedStations.some((s) => s.stationId === id)) return;
    setSelectedStations((prev) => [...prev, { stationId: id, stationName: name, travelTimeNext: 3, distanceNext: 1.0 }]);
  };

  // Remove station from list
  const removeStation = (id: string) => {
    setSelectedStations((prev) => prev.filter((s) => s.stationId !== id));
  };

  // Update station field
  const updateStation = (id: string, field: "travelTimeNext" | "distanceNext", value: number) => {
    setSelectedStations((prev) =>
      prev.map((s) => (s.stationId === id ? { ...s, [field]: value } : s))
    );
  };

  // Filter available stations not yet selected
  const filteredAvailable = availableStations.filter(
    (s) =>
      !selectedStations.some((sel) => sel.stationId === s.id) &&
      s.name.toLowerCase().includes(stationSearch.toLowerCase())
  );

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({ ...data, stations: selectedStations });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? "Cập nhật tuyến" : "Thêm tuyến mới"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 overflow-y-auto w-full">
          <form id="route-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 pt-5">
            {/* TÊN TUYẾN + MÃ TUYẾN */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tên Tuyến</label>
                <input
                  type="text"
                  {...register("name")}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${errors.name ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                    }`}
                  placeholder="Tuyến Cát Linh - Hà Đông"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mã Tuyến</label>
                <input
                  type="text"
                  {...register("routeCode")}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${errors.routeCode ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                    }`}
                  placeholder="CL-HD"
                />
                {errors.routeCode && <p className="text-red-500 text-xs mt-1">{errors.routeCode.message}</p>}
              </div>
            </div>

            {/* MÀU SẮC + TRẠNG THÁI */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Màu nhận diện</label>
                <div className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c)}
                      className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? "scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c, boxShadow: selectedColor === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : "none" }}
                    />
                  ))}
                  <label className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white">
                    <input type="color" onChange={(e) => setValue("color", e.target.value)} className="sr-only" />
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Trạng thái</label>
                <div className="relative">
                  <select
                    {...register("status")}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="maintenance">Dự án / Bảo trì</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CHỌN GA ── */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Danh sách ga <span className="text-red-500">*</span>
                <span className="ml-2 text-gray-400 normal-case font-normal">(chọn ít nhất 1 ga)</span>
              </label>

              {/* Station search dropdown */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-2 bg-gray-50 border-b border-gray-100">
                  <input
                    type="text"
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    placeholder="🔍 Tìm ga để thêm..."
                    className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>
                {/* Available stations list */}
                <div className="max-h-32 overflow-y-auto">
                  {loadingStations ? (
                    <p className="text-xs text-gray-400 text-center py-3">Đang tải danh sách ga...</p>
                  ) : filteredAvailable.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">
                      {availableStations.length === 0 ? "Không có ga nào" : "Không tìm thấy ga phù hợp"}
                    </p>
                  ) : (
                    filteredAvailable.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addStation(s.id, s.name)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between group transition-colors"
                      >
                        <span>{s.name}</span>
                        <span className="text-blue-500 opacity-0 group-hover:opacity-100 text-xs font-medium">+ Thêm</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Selected stations */}
              {selectedStations.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Các ga trong tuyến ({selectedStations.length}):</p>
                  {selectedStations.map((s, idx) => (
                    <div key={s.stationId} className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-2.5">
                      {/* Order badge */}
                      <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full shrink-0">{idx + 1}</span>
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{s.stationName}</span>
                      {/* travelTimeNext */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">⏱</span>
                        <input
                          type="number"
                          min={0}
                          value={s.travelTimeNext}
                          onChange={(e) => updateStation(s.stationId, "travelTimeNext", Number(e.target.value))}
                          className="w-14 px-2 py-1 text-xs border border-blue-200 rounded-lg text-center focus:outline-none focus:border-blue-400"
                          title="Thời gian đến ga tiếp theo (phút)"
                        />
                        <span className="text-xs text-gray-400">ph</span>
                      </div>
                      {/* distanceNext */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">📏</span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={s.distanceNext}
                          onChange={(e) => updateStation(s.stationId, "distanceNext", Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border border-blue-200 rounded-lg text-center focus:outline-none focus:border-blue-400"
                          title="Khoảng cách đến ga tiếp theo (km)"
                        />
                        <span className="text-xs text-gray-400">km</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStation(s.stationId)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Chỉ hiện warning khi tạo mới và chưa chọn ga */}
              {!isEdit && selectedStations.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">⚠ Vui lòng chọn ít nhất 1 ga để tạo tuyến</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 rounded-b-2xl border-t border-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-transparent hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="route-form"
            disabled={isSubmitting || (!isEdit && selectedStations.length === 0)}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : isEdit ? "Lưu thay đổi" : "Tạo tuyến"}
          </button>
        </div>
      </div>
    </div>
  );
}
