/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  IncidentFormData,
  IncidentSeverity,
} from "../../../features/incident/incidentTypes";
import { incidentApi } from "../../../features/incident/incidentApi";
import { stationApi } from "../../../features/station/stationApi";
import { deviceApi } from "../../../features/device/deviceApi";
import toast from "react-hot-toast";
const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
const formSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề sự cố"),
  stationId: z.string().min(1, "Vui lòng chọn ga xảy ra sự cố"),
  deviceId: z.string().optional(),
  severity: z.enum(SEVERITY_OPTIONS, {
    error: "Vui lòng chọn mức độ nghiêm trọng",
  }),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;
interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;

  /** Gọi sau khi tạo thành công — truyền form data để Dashboard có thể optimistic update */
  onSuccess: (formData: FormValues) => void;
}
export default function CreateIncidentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateIncidentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch stations + devices from real API
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    // Fetch stations
    stationApi
      .getStations({ status: "active" }, 1, 200)
      .then((res) =>
        setStations(res.data.map((s) => ({ id: s.id, name: s.name }))),
      )
      .catch(() => setStations([]));
    // Fetch devices
    deviceApi
      .getDevices()
      .then((res) =>
        setDevices(
          res
            .map((d) => ({ id: d.id, name: d.name || d.id }))
            .filter((d) => d.id),
        ),
      )
      .catch(() => setDevices([]));
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      stationId: "",
      deviceId: "",
      severity: "low",
      description: "",
    },
  });

  const severity = watch("severity");

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await incidentApi.createIncident({
        ...data,
        images,
      } as IncidentFormData);
      toast.success("Tạo sự cố thành công!");
      handleClose();
      onSuccess(data);
    } catch (error) {
      console.error(error);
      toast.error("Tạo sự cố thất bại. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    reset();
    setImages([]);
    onClose();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };
  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(
      (f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024,
    );
    if (validFiles.length !== files.length) {
      toast.error("Vui lòng chỉ chọn ảnh (JPG, PNG) dưới 10MB");
    }
    const mappedFiles = validFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    );
    setImages((prev) => [...prev, ...mappedFiles]);
  };
  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImgs = [...prev];
      URL.revokeObjectURL((newImgs[index] as any).preview);
      newImgs.splice(index, 1);
      return newImgs;
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Tạo sự cố mới</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form
            id="create-incident-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Tiêu đề */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tiêu đề sự cố <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Lỗi quét thẻ, Hỏng màn hình..."
                {...register("title")}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.title ? "border-red-500 bg-red-50 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"} outline-none transition`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500 font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>
            {/* Ga xảy ra sự cố (bắt buộc) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Ga xảy ra sự cố <span className="text-red-500">*</span>
              </label>
              <select
                {...register("stationId")}
                className={`w-full px-4 py-2.5 rounded-xl border appearance-none ${
                  errors.stationId
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                } outline-none transition`}
              >
                <option value="">-- Chọn ga --</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.stationId && (
                <p className="mt-1 text-sm text-red-500 font-medium">
                  {errors.stationId.message}
                </p>
              )}
            </div>
            {/* Thiết bị (tuỳ chọn) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Thiết bị gặp sự cố{" "}
                <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <select
                  {...register("deviceId")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  <option value="">-- Không chọn thiết bị cụ thể --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id?.slice(0, 8) ?? ""})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
              {errors.deviceId && (
                <p className="mt-1 text-sm text-red-500 font-medium">
                  {errors.deviceId.message}
                </p>
              )}
            </div>
            {/* Mức độ nghiêm trọng */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Mức độ nghiêm trọng
              </label>
              <div className="grid grid-cols-4 gap-2 bg-gray-50 p-1 rounded-xl">
                {SEVERITY_OPTIONS.map((level: IncidentSeverity) => {
                  const labels: Record<string, string> = {
                    low: "Thấp",
                    medium: "Trung bình",
                    high: "Cao",
                    critical: "Nghiêm trọng",
                  };
                  const activeClass =
                    level === "low"
                      ? "bg-white text-gray-900 shadow-sm"
                      : level === "medium"
                        ? "bg-white text-yellow-600 shadow-sm"
                        : level === "high"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "bg-white text-red-600 shadow-sm";
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setValue("severity", level)}
                      className={`py-2 text-sm font-medium rounded-lg transition-all ${severity === level ? activeClass : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Mô tả chi tiết */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                rows={4}
                placeholder="Mô tả cụ thể tình trạng sự cố..."
                {...register("description")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
              />
            </div>
            {/* Hình ảnh đính kèm */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Hình ảnh đính kèm
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <div
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer group
                    ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) {
                      handleFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Tải ảnh lên hoặc kéo thả vào đây
                  </p>
                  <p className="text-xs text-gray-400">
                    Hỗ trợ JPG, PNG, tối đa 10MB
                  </p>
                </div>
              </div>

              {/* Mức độ nghiêm trọng */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mức độ nghiêm trọng
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1 sm:grid-cols-4">
                  {SEVERITY_OPTIONS.map((level: IncidentSeverity) => {
                    const labels: Record<string, string> = {
                      low: "Thấp",
                      medium: "Trung bình",
                      high: "Cao",
                      critical: "Nghiêm trọng",
                    };
                    const activeClass =
                      level === "low"
                        ? "bg-white text-gray-900 shadow-sm"
                        : level === "medium"
                          ? "bg-white text-yellow-600 shadow-sm"
                          : level === "high"
                            ? "bg-white text-orange-600 shadow-sm"
                            : "bg-white text-red-600 shadow-sm";

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setValue("severity", level)}
                        className={`py-2 text-sm font-medium rounded-lg transition-all ${severity === level ? activeClass : "text-gray-500 hover:bg-gray-100"}`}
                      >
                        {labels[level]}
                      </button>
                    );
                  })}
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {images.map((img: any, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group"
                      >
                        <img
                          src={img.preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-white"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-2xl bg-gray-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="create-incident-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang tạo...
              </>
            ) : (
              "Tạo sự cố"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
