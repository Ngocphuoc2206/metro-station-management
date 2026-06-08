/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { History, LayoutDashboard, MapPinned, QrCode, Ticket, TrainFront, UserRound } from "lucide-react";
import PassengerLogoutButton from "@components/parts/PassengerLogoutButton/PassengerLogoutButton";
import { PROFILE_UPDATED_EVENT, profileApi } from "@features/profile/profileApi";
import type { MyProfileDto } from "@features/profile/profileTypes";
import type { RootState } from "@stores/index";

const BrandMark = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.333 16c0-5.97 4.697-10.667 10.667-10.667h8v8c0 5.97-4.697 10.667-10.667 10.667h-8v-8Z" fill="#2563EB" />
    <path d="M8 18.667c0-5.97 4.697-10.667 10.667-10.667H24v5.333c0 5.97-4.697 10.667-10.667 10.667H8v-5.333Z" fill="#1D4ED8" />
  </svg>
);

const navItems = [
  { label: "Bảng điều khiển", href: "/passenger-page", icon: LayoutDashboard },
  { label: "Mua vé", href: "/passenger-page/buy-tickets-step-1", icon: Ticket },
  { label: "Vé của tôi", href: "/passenger-page/my-tickets", icon: QrCode },
  { label: "Lịch sử chuyến", href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", href: "/passenger-page/schedule", icon: TrainFront },
  { label: "Bản đồ trực tuyến", href: "/passenger-page/live-map", icon: MapPinned },
  { label: "Tài khoản", href: "/passenger-page/account", icon: UserRound },
];

const isNavActive = (pathname: string, href: string) => {
  if (href === "/passenger-page") return pathname === href;
  if (href === "/passenger-page/buy-tickets-step-1") {
    return pathname.startsWith("/passenger-page/buy-tickets-step-") || pathname === "/passenger-page/payment-success";
  }
  return pathname === href;
};

export default function PassengerSidebar() {
  const router = useRouter();
  const { name, email } = useSelector((state: RootState) => state.userReducer);
  const [profile, setProfile] = useState<MyProfileDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileApi.getMyProfile().then((data) => {
      if (!cancelled) setProfile(data);
    }).catch(() => {
      // Session data remains available when profile cannot be loaded.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const updatedProfile = (event as CustomEvent<MyProfileDto>).detail;
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  const displayName = profile?.fullName?.trim() || name || "Hành khách";
  const displayEmail = profile?.email || email || "Metro";
  const primaryMobileItems = navItems;

  return (
    <>
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex items-center gap-3 p-6">
        <BrandMark className="h-8 w-8" />
        <Link href="/" className="text-xl font-bold leading-6 text-neutral-900">Metro</Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(router.pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${active ? "bg-blue-600/10 text-blue-600" : "text-slate-700 hover:bg-slate-100"}`}>
              <Icon className={`h-4 w-4 ${active ? "text-blue-600" : "text-slate-500"}`} />
              <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4">
        <div className="flex items-center gap-3 rounded-2xl p-2" title={`${displayName} - ${displayEmail}`}>
          <img className="h-10 w-10 rounded-full object-cover" src={profile?.avatarUrl || "https://placehold.co/40x40"} alt="Ảnh đại diện hành khách" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{displayEmail}</p>
          </div>
        </div>
        <PassengerLogoutButton />
      </div>
    </aside>

    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0px_-10px_30px_-24px_rgba(15,23,42,0.45)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl gap-1 overflow-x-auto">
        {primaryMobileItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(router.pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition ${
                active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="w-full truncate text-[10px] font-bold leading-3">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
