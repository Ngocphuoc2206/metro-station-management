import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import type { RootState } from "@stores/index";
import LoginForm from "@components/organisms/LoginForm/LoginForm";
import { ROLE_PATHS } from "@/const/Role";

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { isLoggedIn, role } = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    if (isLoggedIn && role) {
      const redirectTo = (router.query.redirectTo as string) || ROLE_PATHS[role] || "/auth/login";
      router.replace(redirectTo);
    }
  }, [isLoggedIn, role, router]);

  if (isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Đăng nhập | MetroNext</title>
        <meta name="description" content="Đăng nhập vào MetroNext để quản lý vé và hành trình của bạn" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-xl flex bg-white">

          {/* ── Left panel: Branding ── */}
          <div
            className="hidden md:flex md:w-[45%] relative overflow-hidden"
            style={{
              backgroundImage: "url('/images/metro-bg.jpg')",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/40" />

            {/* Decorative circles */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-600/10 rounded-full" />
            <div className="absolute top-1/2 -right-16 w-56 h-56 bg-blue-600/10 rounded-full" />
            <div className="absolute -bottom-16 left-16 w-48 h-48 bg-blue-600/10 rounded-full" />

            <div className="relative z-10 flex flex-col w-full px-10 py-10 h-full">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V5z" />
                    <path d="M9.5 12h5v4h-5v-4z" />
                    <path d="M9 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    <path d="M15 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-tight text-gray-900">MetroNext</span>
              </div>

              {/* Headline */}
              <div className="mt-12">
                <h1 className="font-display text-4xl font-extrabold leading-tight text-gray-900">
                  Chào mừng<br />trở lại!
                </h1>
                <p className="text-gray-600 mt-4 leading-relaxed text-sm max-w-xs">
                  Hệ thống vé điện tử Metro thông minh — quản lý hành trình, mua vé và theo dõi lịch sử dễ dàng.
                </p>
              </div>

              {/* Stats card */}
              <div className="mt-auto">
                <div className="bg-white/80 border border-gray-200 rounded-xl p-4 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["🧑", "👩", "👨"].map((e, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm">
                          {e}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">Hơn 2.000+ người dùng</p>
                      <p className="text-gray-500 text-xs">đang sử dụng MetroNext mỗi ngày</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel: Form ── */}
          <div className="w-full md:w-[55%] bg-white flex items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-md">
              {/* Mobile logo */}
              <div className="md:hidden flex items-center gap-2 mb-8">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V5z" />
                  </svg>
                </div>
                <span className="font-bold text-xl text-blue-600">MetroNext</span>
              </div>

              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900">Đăng nhập</h2>
                <p className="text-gray-500 text-sm mt-1">Vui lòng nhập thông tin để tiếp tục</p>
              </div>

              <LoginForm />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginPage;

