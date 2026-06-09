import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/index";

const BUY_TICKET_PATH = "/passenger-page/buy-tickets-step-1";
const LOGIN_TO_BUY_TICKET_PATH = `/auth/login?redirectTo=${encodeURIComponent(
  BUY_TICKET_PATH,
)}`;

const NAV_ITEMS = [
  { label: "Tính năng", href: "#features" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Mua vé", href: BUY_TICKET_PATH, requiresAuth: true },
];

export const UserHeader = () => {
  const { isLoggedIn } = useSelector((state: RootState) => state.userReducer);

  return (
    <header className="w-full border-b border-slate-200 bg-neutral-100/80 backdrop-blur-[6px]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-3 md:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
            <svg
              aria-hidden="true"
              className="h-8 w-8"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.333 16c0-5.97 4.697-10.667 10.667-10.667h8v8c0 5.97-4.697 10.667-10.667 10.667h-8v-8Z"
                fill="#2563EB"
              />
              <path
                d="M8 18.667c0-5.97 4.697-10.667 10.667-10.667H24v5.333c0 5.97-4.697 10.667-10.667 10.667H8v-5.333Z"
                fill="#1D4ED8"
              />
            </svg>
          </div>

          <Link
            href="/"
            className="text-xl font-bold leading-6 text-neutral-900"
          >
            Metro
          </Link>
        </div>

        <nav
          aria-label="Điều hướng chính"
          className="hidden flex-1 justify-center md:flex"
        >
          <ul className="flex items-center gap-9">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={
                    item.requiresAuth && !isLoggedIn
                      ? LOGIN_TO_BUY_TICKET_PATH
                      : item.href
                  }
                  className="text-sm font-medium leading-5 text-neutral-900 transition-colors hover:text-blue-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/auth/login"
          className="inline-flex h-10 min-w-24 items-center justify-center overflow-hidden rounded-3xl bg-blue-600 px-4 transition-colors hover:bg-blue-700"
        >
          <span className="inline-flex flex-col items-center justify-start overflow-hidden">
            <span className="h-5 w-20 text-center text-sm font-bold leading-5 tracking-tight text-white">
              Đăng nhập
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
};
