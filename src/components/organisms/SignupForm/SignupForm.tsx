import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";

import { signupSchema, type SignupFormValues } from "@features/auth/validations";
import { registerUser, checkEmailExists } from "@features/auth/authApi";
import EyeIcon from "@components/parts/EyeIcon/EyeIcon";
import PasswordStrengthIndicator from "@components/parts/PasswordStrengthIndicator/PasswordStrengthIndicator";

const DEBOUNCE_DELAY = 500;

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const watchedPassword = watch("password");
  const watchedEmail = watch("email");

  const checkEmail = useCallback((email: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(null);
      setIsCheckingEmail(false);
      return;
    }

    setIsCheckingEmail(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkEmailExists(email);
        setEmailExists(result.exists);
      } catch {
        setEmailExists(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  useEffect(() => {
    checkEmail(watchedEmail);
  }, [watchedEmail, checkEmail]);

  useEffect(() => {
    if (emailExists === true) {
      setError("email", { type: "manual", message: "Email này đã được đăng ký" });
    }
  }, [emailExists, setError]);

  const onSubmit = async (data: SignupFormValues) => {
    if (emailExists) {
      setError("email", { type: "manual", message: "Email này đã được đăng ký" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      if (response.success) {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập", { duration: 4000 });
        router.push("/auth/login?registered=true");
      } else {
        toast.error(response.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Đã có lỗi xảy ra.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200";
  const inputValid = "border-gray-200 bg-white focus:ring-blue-500 focus:border-blue-400";
  const inputError = "border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Họ tên */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Họ tên <span className="text-red-400">*</span>
        </label>
        <input
          {...register("name")}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          className={`${inputBase} ${errors.name ? inputError : inputValid}`}
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            {...register("email")}
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            className={`${inputBase} ${errors.email ? inputError : inputValid} pr-11`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingEmail && (
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            {!isCheckingEmail && emailExists === false && watchedEmail && (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.email.message}
          </p>
        )}
      </div>

      {/* Số điện thoại */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Số điện thoại <span className="text-red-400">*</span>
        </label>
        <input
          {...register("phone")}
          type="tel"
          placeholder="0981 234 567"
          autoComplete="tel"
          className={`${inputBase} ${errors.phone ? inputError : inputValid}`}
        />
        {errors.phone ? (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.phone.message}
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Số điện thoại sẽ không được hiển thị công khai</p>
        )}
      </div>

      {/* Mật khẩu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Mật khẩu <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
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
        <PasswordStrengthIndicator password={watchedPassword} />
        {errors.password && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.password.message}
          </p>
        )}
      </div>

      {/* Xác nhận mật khẩu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Xác nhận mật khẩu <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            className={`${inputBase} ${errors.confirmPassword ? inputError : inputValid} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
          >
            <EyeIcon open={showConfirmPassword} />
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Điều khoản */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            Tôi đồng ý với{" "}
            <Link href="/terms" className="text-blue-600 font-medium hover:underline" target="_blank">
              Điều khoản sử dụng
            </Link>{" "}
            &{" "}
            <Link href="/terms" className="text-blue-600 font-medium hover:underline" target="_blank">
              Chính sách bảo mật
            </Link>{" "}
            của MetroNext
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200 mt-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang tạo tài khoản...
          </span>
        ) : (
          "Tạo tài khoản"
        )}
      </button>

      <p className="text-center text-sm text-gray-500 pb-1">
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
