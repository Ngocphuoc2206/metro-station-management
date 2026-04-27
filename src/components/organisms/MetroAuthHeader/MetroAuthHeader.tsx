import Link from "next/link";
import { Bell, CircleUserRound } from "lucide-react";

const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Lịch trình", href: "#" },
  { label: "Bản đồ", href: "#" },
  { label: "Tin tức", href: "#" },
];

export const MetroAuthHeader = () => {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
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

          <Link href="/" className="text-xl font-bold leading-6 text-neutral-900">
            MetroNext
          </Link>
        </div>

        <nav aria-label="Main navigation" className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-9">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm font-medium leading-5 text-neutral-900 transition-colors hover:text-blue-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            aria-label="Thông báo"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-neutral-900 transition-colors hover:bg-slate-300"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Tài khoản"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-neutral-900 transition-colors hover:bg-slate-300"
          >
            <CircleUserRound className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
