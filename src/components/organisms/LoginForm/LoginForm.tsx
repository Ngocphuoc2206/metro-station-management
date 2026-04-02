import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch } from "react-redux";

import { loginSchema, type LoginFormValues } from "@features/auth/validations";
import { loginUser } from "@features/auth/authApi";
import { loginSuccess } from "@stores/slices/userSlice";
import { type AppDispatch } from "@stores/index";
import EyeIcon from "@components/parts/EyeIcon/EyeIcon";
import { ROLE_PATHS } from "@/const/Role";

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const response = await loginUser(data);
      if (response.success && response.data) {
        localStorage.setItem("authToken", response.data.token);
        dispatch(
          loginSuccess({
            name: response.data.name,
            email: response.data.email,
            role: response.data.role,
            token: response.data.token,
          }),
        );
        router.push(ROLE_PATHS[response.data.role] ?? "/auth/login");
        return;
      }
      const message =
        response.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setApiError(message);
      setError("password", { type: "manual", message });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message ||
        err.message ||
        "Sai email hoặc mật khẩu.";
      setApiError(message);
      setError("password", { type: "manual", message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200";
  const inputValid =
    "border-gray-200 bg-white focus:ring-blue-500 focus:border-blue-400";
  const inputError =
    "border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          className={`${inputBase} ${errors.email ? inputError : inputValid}`}
        />
        {errors.email?.message && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Mật khẩu
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${inputBase} ${errors.password ? inputError : inputValid} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {apiError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {apiError}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/signup"
          className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>

      {process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs text-amber-700 font-semibold">
            🧪 Mock Mode — backend chưa kết nối
          </p>
          <p className="text-xs text-amber-600">
            Dùng một trong các tài khoản sau (mật khẩu ≥ 6 ký tự):
          </p>
          <ul className="text-xs text-amber-700 font-mono space-y-0.5 mt-1">
            <li>
              • <strong>admin@test.vn</strong> → Quản trị viên
            </li>
            <li>
              • <strong>staff@test.vn</strong> → Nhân viên ga
            </li>
            <li>
              • <strong>passenger@test.vn</strong> → Hành khách
            </li>
            <li>
              • <strong>scanner@test.vn</strong> → Gate Scanner
            </li>
          </ul>
        </div>
      )}
    </form>
  );
}
