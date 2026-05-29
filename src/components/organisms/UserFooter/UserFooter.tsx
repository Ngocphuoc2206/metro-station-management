import Link from "next/link";
import { Globe, Mail, MapPin, Network, Phone } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Tính năng", href: "#features" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Demo ứng dụng", href: "#demo" },
  { label: "API cho đối tác", href: "#api" },
];

const SUPPORT_LINKS = [
  { label: "Hướng dẫn sử dụng", href: "#guide" },
  { label: "Chính sách bảo mật", href: "#privacy" },
  { label: "Điều khoản dịch vụ", href: "#terms" },
  { label: "Câu hỏi thường gặp", href: "#faq" },
];

const CONTACT_ITEMS = [
  {
    label: "contact@metronext.vn",
    href: "mailto:contact@metronext.vn",
    icon: <Mail aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />,
  },
  {
    label: "1900 6789",
    href: "tel:19006789",
    icon: <Phone aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />,
  },
  {
    label: "Quận 1, TP. Hồ Chí Minh",
    href: "#location",
    icon: <MapPin aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />,
  },
];

export const UserFooter = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-100 px-6 py-12 md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 md:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12c0-4.477 3.523-8 8-8h6v6c0 4.477-3.523 8-8 8H4v-6Z"
                    fill="#2563EB"
                  />
                  <path
                    d="M6 14c0-4.477 3.523-8 8-8h4v4c0 4.477-3.523 8-8 8H6v-4Z"
                    fill="#1D4ED8"
                  />
                </svg>
              </div>
              <div className="text-lg font-bold leading-7 text-neutral-900">Metro</div>
            </div>

            <p className="text-sm leading-6 text-slate-500">
              Tiên phong công nghệ giao thông
              <br />
              công cộng thông minh tại Việt Nam.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-base font-bold leading-6 text-neutral-900">Sản phẩm</h4>
            <ul className="flex flex-col gap-4">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm font-normal leading-5 text-slate-500 transition-colors hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-base font-bold leading-6 text-neutral-900">Hỗ trợ</h4>
            <ul className="flex flex-col gap-4">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm font-normal leading-5 text-slate-500 transition-colors hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-base font-bold leading-6 text-neutral-900">Liên hệ</h4>
            <ul className="flex flex-col gap-4">
              {CONTACT_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-slate-500">
                  <span className="inline-flex items-center justify-center">{item.icon}</span>
                  <Link
                    href={item.href}
                    className="text-sm font-normal leading-5 text-slate-500 transition-colors hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-normal leading-5 text-slate-500">
            © 2024 Metro. Bảo lưu mọi quyền.
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="#internet"
              aria-label="Internet"
              className="text-slate-400 transition-colors hover:text-blue-500"
            >
              <Globe aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </Link>
            <Link
              href="#network"
              aria-label="Mạng"
              className="text-slate-400 transition-colors hover:text-blue-500"
            >
              <Network aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
