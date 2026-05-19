import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, UserRole } from "@features/user/userTypes";

const schema = z.object({
  name: z.string().min(2, "Bắt buộc nhập họ tên"),
  email: z.string().email("Sai định dạng Email"),
  role: z.enum(["admin", "staff", "scanner", "passenger"]),
  status: z.enum(["active", "inactive"]),
  assignedStationId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (data: FormData & { tempPassword?: string }) => Promise<void>;
  mockStations: { id: string; name: string }[];
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  mockStations,
}: Props) {
  const [tempPassword, setTempPassword] = useState("");

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
      email: "",
      role: "passenger",
      status: "active",
      assignedStationId: "",
    },
  });

  const isEdit = !!user;
  const currentRole = watch("role");
  const showStationPicker =
    currentRole === "staff" || currentRole === "scanner";

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          assignedStationId: user.assignedStationId || "",
        });
        setTempPassword(""); // Don't show password editing for now
      } else {
        reset({
          name: "",
          email: "",
          role: "passenger",
          status: "active",
          assignedStationId: "",
        });
        setTempPassword("");
      }
    }
  }, [isOpen, reset, user]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let p = "Metro@";
    for (let i = 0; i < 6; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(p);
  };

  const handleFormSubmit = async (data: FormData) => {
    const finalData = { ...data };
    if (!showStationPicker) {
      finalData.assignedStationId = undefined; // Clear station if role changed
    }
    await onSubmit({ ...finalData, tempPassword });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Cập nhật người dùng" : "Thêm người dùng mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
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
            id="user-form"
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* ROW 1: Tên + Email */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wide">
                Họ và tên
              </label>
              <input
                type="text"
                {...register("name")}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                  errors.name
                    ? "border-red-300"
                    : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="Nhập họ và tên đầy đủ"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="text"
                {...register("email")}
                disabled={isEdit} // Thường email không cho đổi
                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                  errors.email
                    ? "border-red-300"
                    : "border-gray-200 focus:border-blue-400"
                } ${isEdit ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                placeholder="example@metronext.vn"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ROW 2: Vai trò + Ga */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wide">
                  Vai trò
                </label>
                <div className="relative">
                  <select
                    {...register("role")}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                  >
                    <option value="passenger">Passenger</option>
                    <option value="staff">Nhân viên ga (Staff)</option>
                    <option value="scanner">Nhân viên soát vé (Scanner)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                      className="w-4 h-4"
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

              {showStationPicker ? (
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wide">
                    Gán nhà ga
                  </label>
                  <div className="relative">
                    <select
                      {...register("assignedStationId")}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                    >
                      <option value="">-- Chọn nhà ga --</option>
                      {mockStations.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg
                        className="w-4 h-4"
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
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                    Gán nhà ga
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Không áp dụng"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Trạng thái Account (Hiển thị mode Edit hoặc Advanced) */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">
                Trạng thái tài khoản
              </label>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setValue(
                      "status",
                      watch("status") === "active" ? "inactive" : "active",
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    watch("status") === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      watch("status") === "active"
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-bold ${watch("status") === "active" ? "text-emerald-600" : "text-gray-500"}`}
                >
                  {watch("status") === "active"
                    ? "Cho phép đăng nhập (Active)"
                    : "Khoá tài khoản (Inactive)"}
                </span>
              </div>
            </div>

            {/* ROW 3: Mật khẩu (Chỉ hiện lúc Create) */}
            {!isEdit && (
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wide">
                  Mật khẩu tạm thời
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={tempPassword}
                    placeholder="Chưa khởi tạo..."
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono tracking-wider text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors shrink-0"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Hệ thống sẽ yêu cầu người dùng đổi mật khẩu trong lần đăng
                  nhập đầu tiên.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-transparent hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 border border-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={isSubmitting || (!isEdit && !tempPassword)} // Bắt buộc phải tạo mật khẩu mới cho đi qua
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[140px]"
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
            ) : isEdit ? (
              "Lưu thay đổi"
            ) : (
              "Tạo tài khoản"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
