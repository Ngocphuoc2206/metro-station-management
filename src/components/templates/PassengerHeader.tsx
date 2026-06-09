/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Bell, LogOut, Search, UserRound } from "lucide-react";
import { useLogout } from "@features/auth/useLogout";
import { PROFILE_UPDATED_EVENT, profileApi } from "@features/profile/profileApi";
import type { MyProfileDto } from "@features/profile/profileTypes";
import type { RootState } from "@stores/index";

type PassengerHeaderProps = {
  searchPlaceholder?: string;
};

export default function PassengerHeader({
  searchPlaceholder = "Tìm kiếm ga, vé, lịch trình...",
}: PassengerHeaderProps) {
  const { name } = useSelector((state: RootState) => state.userReducer);
  const handleLogout = useLogout();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getMyProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // Header can still render from session data if profile is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const updatedProfile = (event as CustomEvent<MyProfileDto>).detail;
      if (updatedProfile) setProfile(updatedProfile);
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const displayName = profile?.fullName?.trim() || name || "Hành khách";
  const avatarUrl = profile?.avatarUrl;
  const initial = displayName.trim().charAt(0).toUpperCase() || "H";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white pl-16 pr-4 sm:px-8">
      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none placeholder:text-slate-500 sm:pr-4"
          placeholder={searchPlaceholder}
          readOnly
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Thông báo"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />

        <div
          ref={menuRef}
          className="relative"
          onMouseEnter={() => setIsProfileMenuOpen(true)}
          onMouseLeave={() => setIsProfileMenuOpen(false)}
          onFocus={() => setIsProfileMenuOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsProfileMenuOpen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-0 text-left transition hover:bg-slate-50 sm:pl-3 sm:pr-1"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
          >
            <span className="hidden max-w-[160px] truncate text-sm font-bold text-slate-800 sm:block">
              {displayName}
            </span>
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm">
              {avatarUrl ? (
                <img
                  className="h-9 w-9 rounded-full object-cover"
                  src={avatarUrl}
                  alt="Ảnh đại diện hành khách"
                />
              ) : (
                initial
              )}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </button>

          {isProfileMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full w-64 pt-3"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                    {avatarUrl ? (
                      <img
                        className="h-11 w-11 rounded-full object-cover"
                        src={avatarUrl}
                        alt="Ảnh đại diện hành khách"
                      />
                    ) : (
                      initial
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="text-xs font-medium text-slate-500">Hành khách</p>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
              <Link
                href="/passenger-page/account"
                role="menuitem"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4 text-slate-400" />
                <span>Quản lí hồ sơ</span>
              </Link>
              <div className="h-px bg-slate-100" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-bold text-red-500 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
