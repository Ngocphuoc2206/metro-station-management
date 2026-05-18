import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TicketType } from "@features/ticketType/ticketTypeTypes";

const schema = z.object({
  name: z.string().min(2, "Tên loại vé bắt buộc nhập"),
  code: z.string().min(2, "Mã loại bắt buộc nhập").toUpperCase(),
  validityDuration: z.coerce
    .number()
    .min(1, "Thời gian hiệu lực phải lớn hơn 0"),
  validityUnit: z.enum(["hours", "days"]),
  price: z.coerce.number().min(0, "Giá tiền không hợp lệ"),
  status: z.enum(["active", "inactive"]),
  conditions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticketType?: TicketType | null;
  onSubmit: (data: FormData) => Promise<void>;
}

export default function TicketTypeFormModal({
  isOpen,
  onClose,
  ticketType,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      code: "",
      validityDuration: 24,
      validityUnit: "hours",
      price: 0,
      status: "active",
      conditions: "",
    },
  });

  const isEdit = !!ticketType;
  const currentStatus = watch("status");

  useEffect(() => {
    if (isOpen) {
      if (ticketType) {
        reset({
          name: ticketType.name,
          code: ticketType.code,
          validityDuration: ticketType.validityDuration,
          validityUnit: ticketType.validityUnit,
          price: ticketType.price,
          status: ticketType.status,
          conditions: ticketType.conditions,
        });
      } else {
        reset({
          name: "",
          code: "",
          validityDuration: 24,
          validityUnit: "hours",
          price: 0,
          status: "active",
          conditions: "",
        });
      }
    }
  }, [isOpen, reset, ticketType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Cập nhật loại vé" : "Thêm loại vé mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
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
        <div className="px-6 py-6 overflow-y-auto w-full custom-scrollbar">
          <form
            id="ticket-type-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* ROW 1: Tên loại vé + Mã loại */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1.5">
                  Tên loại vé
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                    errors.name
                      ? "border-red-300"
                      : "border-gray-200 focus:border-blue-400"
                  }`}
                  placeholder="VD: Vé ngày"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1.5">
                  Mã loại
                </label>
                <input
                  type="text"
                  {...register("code")}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                    errors.code
                      ? "border-red-300"
                      : "border-gray-200 focus:border-blue-400"
                  }`}
                  placeholder="VD: V-NGAY-01"
                />
                {errors.code && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>

            {/* ROW 2: Thời gian hiệu lực + Group (SỐ + UNIT) */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1.5">
                Thời gian hiệu lực
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    {...register("validityDuration")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                      errors.validityDuration
                        ? "border-red-300"
                        : "border-gray-200 focus:border-blue-400"
                    }`}
                    placeholder="Số lượng"
                  />
                  {errors.validityDuration && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.validityDuration.message}
                    </p>
                  )}
                </div>
                <div className="w-1/3 relative">
                  <select
                    {...register("validityUnit")}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                  >
                    <option value="hours">Giờ</option>
                    <option value="days">Ngày</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: Giá niêm yết + Trạng thái */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1.5">
                  Giá niêm yết
                </label>
                <div className="relative">
                  <input
                    type="number"
                    {...register("price")}
                    className={`w-full pl-4 pr-12 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                      errors.price
                        ? "border-red-300"
                        : "border-gray-200 focus:border-blue-400"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    VND
                  </span>
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-900 mb-2">
                  Trạng thái
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        "status",
                        currentStatus === "active" ? "inactive" : "active",
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currentStatus === "active" ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentStatus === "active"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    {currentStatus === "active" ? "Hoạt động" : "Ngừng áp dụng"}
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 4: Quy định sử dụng */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1.5">
                Quy định sử dụng
              </label>
              <textarea
                {...register("conditions")}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors resize-none"
                placeholder="VD: Không giới hạn lượt đi trong vòng 24 giờ kể từ lúc kích hoạt..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-transparent hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="ticket-type-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[130px]"
          >
            {isSubmitting ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            ) : (
              "Lưu thông tin"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
