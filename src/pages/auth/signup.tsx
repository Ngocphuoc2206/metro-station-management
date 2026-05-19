import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import type { RootState } from "@stores/index";
import SignupForm from "@components/organisms/SignupForm/SignupForm";
import { ROLE_PATHS } from "@/const/Role";

const SignupPage: NextPage = () => {
  const router = useRouter();
  const { isLoggedIn, role } = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    if (isLoggedIn && role) {
      router.replace(ROLE_PATHS[role] || "/auth/login");
    }
  }, [isLoggedIn, role, router]);

  if (isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Đăng ký | MetroNext</title>
        <meta name="description" content="Tạo tài khoản MetroNext để bắt đầu hành trình của bạn" />
      </Head>

      <div className="min-h-screen flex bg-white">
        {/* ── Left panel: Branding ── */}
        <div
          className="hidden lg:flex lg:w-[45%] relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/metro-bg.jpg')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700/80 to-blue-500/50" />
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-white/10 rounded-full" />

          <div className="relative z-10 flex flex-col w-full px-10 py-10 h-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V5z" />
                  <path d="M9.5 12h5v4h-5v-4z" />
                  <path d="M9 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  <path d="M15 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">MetroNext</span>
            </div>

            {/* Main copy */}
            <div className="mt-auto mb-auto pt-16">
              <h2 className="font-display text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
                Bắt đầu hành trình<br />của bạn ngay hôm nay
              </h2>
              <p className="text-blue-100/90 mt-4 text-sm leading-relaxed max-w-xs">
                Gia nhập MetroNext — trải nghiệm mua vé tàu điện ngầm thông minh, nhanh chóng và tiện lợi nhất.
              </p>

              {/* Feature list */}
              <ul className="mt-8 space-y-3">
                {[
                  "Mua vé điện tử chỉ trong 30 giây",
                  "QR code hiển thị ngay trên điện thoại",
                  "Theo dõi lịch sử hành trình dễ dàng",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-white/90 text-sm">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Right panel: Form ── */}
        <div className="w-full lg:w-[55%] flex items-center justify-center bg-gray-50 p-6 sm:p-10">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V5z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-600">MetroNext</span>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h2>
              <p className="text-gray-500 text-sm mt-1">Điền thông tin bên dưới để bắt đầu</p>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <SignupForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;

