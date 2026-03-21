import Head from "next/head";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <>
      <Head>
        <title>Không có quyền truy cập | MetroNext</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Status code */}
          <p className="text-6xl font-black text-gray-200 leading-none mb-2">403</p>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Không có quyền truy cập</h1>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Tài khoản của bạn không có quyền truy cập vào trang này.
            Vui lòng đăng nhập với đúng vai trò hoặc liên hệ quản trị viên.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm shadow-blue-200"
            >
              Đăng nhập lại
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
