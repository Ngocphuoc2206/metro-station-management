import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Station } from "@features/station/stationTypes";

const coordinateSchema = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Vui lòng nhập ${label}`)
    .refine((value) => Number.isFinite(Number(value)), `${label} phải là số`)
    .refine((value) => {
      const numericValue = Number(value);
      return numericValue >= min && numericValue <= max;
    }, `${label} không hợp lệ`);

const schema = z.object({
  name: z.string().min(2, "Tên ga phải có ít nhất 2 ký tự"),
  zone: z.string().min(1, "Vui lòng nhập khu vực"),
  lat: coordinateSchema(-90, 90, "vĩ độ (LAT)"),
  lng: coordinateSchema(-180, 180, "kinh độ (LONG)"),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  onSubmit: (data: Omit<Station, "id" | "code">) => Promise<void>;
}

export default function StationFormModal({
  isOpen,
  onClose,
  station,
  onSubmit,
}: Props) {
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
      zone: "",
      lat: "",
      lng: "",
      status: "active",
    },
  });

  const isEdit = !!station;

  useEffect(() => {
    if (isOpen) {
      if (station) {
        const [locationLat = "", locationLng = ""] = station.location.split(",");
        const lat = station.lat || locationLat.trim();
        const lng = station.lng || locationLng.trim();
        
        reset({
          name: station.name,
          zone: station.zone,
          lat,
          lng,
          status: station.status,
        });
      } else {
        reset({
          name: "",
          zone: "",
          lat: "",
          lng: "",
          status: "active",
        });
      }
    }
  }, [isOpen, station, reset]);

  if (!isOpen) return null;

  const currentStatus = watch("status");

  const applyCoordinatePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const match = pastedText.match(/(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)/);
    if (!match) return;

    const lat = match[1].replace(",", ".");
    const lng = match[2].replace(",", ".");
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;

    event.preventDefault();
    setValue("lat", lat, { shouldDirty: true, shouldValidate: true });
    setValue("lng", lng, { shouldDirty: true, shouldValidate: true });
  };

  const submitHandler = async (data: FormData) => {
    // Combine lat and lng into location
    await onSubmit({
      name: data.name,
      line: station?.line ?? "L1",
      zone: data.zone,
      lat: data.lat.trim(),
      lng: data.lng.trim(),
      location: `${data.lat}, ${data.lng}`,
      status: data.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Chỉnh sửa nhà ga" : "Thêm nhà ga mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto">
          <form id="station-form" onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            {/* TÊN NHÀ GA */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tên nhà ga</label>
              <input
                type="text"
                {...register("name")}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                  errors.name ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="Ví dụ: Ga Bến Thành"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* KHU VỰC (ZONE) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Khu vực (Zone)</label>
              <div className="relative">
                <input
                  type="text"
                  {...register("zone")}
                  className={`w-full px-4 py-2.5 pr-10 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                    errors.zone ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                  }`}
                  placeholder="Khu vực 1"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-100 rounded text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
              {errors.zone && <p className="text-red-500 text-xs mt-1">{errors.zone.message}</p>}
            </div>

            {/* TỌA ĐỘ GPS */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tọa độ GPS</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">LAT</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    {...register("lat")}
                    onPaste={applyCoordinatePaste}
                    className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                      errors.lat ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                    }`}
                    placeholder="10.7769"
                  />
                  {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat.message}</p>}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">LONG</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    {...register("lng")}
                    onPaste={applyCoordinatePaste}
                    className={`w-full pl-12 pr-3 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                      errors.lng ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                    }`}
                    placeholder="106.7009"
                  />
                  {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng.message}</p>}
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Có thể dán trực tiếp cặp tọa độ từ bản đồ, ví dụ: 10.7769, 106.7009.
              </p>
            </div>

            <hr className="border-gray-100 my-4" />

            {/* TRẠNG THÁI */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Trạng thái</p>
                <p className="text-xs text-gray-500 mt-0.5">Kích hoạt nhà ga ngay khi thêm</p>
              </div>
              
              <button
                type="button"
                onClick={() => setValue("status", currentStatus === "active" ? "inactive" : "active")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${currentStatus === "active" ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${currentStatus === "active" ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
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
            form="station-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? (
               <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : isEdit ? "Lưu thay đổi" : "Thêm ga"}
          </button>
        </div>
      </div>
    </div>
  );
}
