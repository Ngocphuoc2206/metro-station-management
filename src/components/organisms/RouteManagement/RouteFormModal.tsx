import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Route } from "@features/route/routeTypes";

const schema = z.object({
  name: z.string().min(2, "Tên tuyến phải có ít nhất 2 ký tự"),
  color: z.string().min(4, "Vui lòng chọn màu nhận diện"),
  status: z.enum(["active", "inactive", "maintenance"]),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  route?: Route | null;
  onSubmit: (data: FormData) => Promise<void>;
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
      color: COLORS[0],
      status: "active",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (route) {
        reset({
          name: route.name,
          color: route.color,
          status: route.status,
          description: route.description,
        });
      } else {
        reset({
          name: "",
          color: COLORS[0],
          status: "active",
          description: "",
        });
      }
    }
  }, [isOpen, reset, route]);

  if (!isOpen) return null;

  const selectedColor = watch("color");
  const isEdit = !!route;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? "Cập nhật tuyến" : "Thêm tuyến mới"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto w-full">
          <form id="route-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* TÊN TUYẾN */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tên Tuyến</label>
              <input
                type="text"
                {...register("name")}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                  errors.name ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="Ví dụ: Line 04"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* MÀU SẮC NHẬN DIỆN */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Màu sắc nhận diện</label>
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={`w-8 h-8 rounded-full transition-transform ${selectedColor === c ? "scale-110" : "hover:scale-105"}`}
                    style={{ 
                      backgroundColor: c, 
                      boxShadow: selectedColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none" 
                    }}
                  />
                ))}
                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                {/* Custom Color Picker Input */}
                <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white">
                  <input 
                    type="color" 
                    onChange={(e) => setValue("color", e.target.value)} 
                    className="sr-only" 
                  />
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </label>
              </div>
              {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
            </div>

            {/* TRẠNG THÁI BAN ĐẦU */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Trạng thái ban đầu</label>
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

            {/* MÔ TẢ NGẮN */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mô tả ngắn</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                placeholder="Nhập lộ trình chính hoặc đặc điểm tuyến..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-gray-50">
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
            disabled={isSubmitting}
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
