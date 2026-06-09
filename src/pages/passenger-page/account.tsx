/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import PassengerChatbotWidget from "@components/organisms/PassengerChatbot/PassengerChatbotWidget";
import PassengerHeader from "@components/templates/PassengerHeader";
import PassengerSidebar from "@components/templates/PassengerSidebar";
import { notifyProfileUpdated, profileApi } from "@features/profile/profileApi";
import type { MyProfileDto } from "@features/profile/profileTypes";
import {
  Camera,
  ChevronRight,
  CreditCard,
  Plus,
  Shield,
  Trash2,
  User,
} from "lucide-react";

const linkedPayments = [
  {
    title: "Visa ending in 1234",
    subtitle: "Expires 12/26",
    tone: "text-blue-600 bg-blue-50",
    icon: CreditCard,
  },
  {
    title: "Ví điện tử MoMo",
    subtitle: "090****567",
    tone: "text-amber-600 bg-amber-50",
    icon: CreditCard,
  },
];

export default function PassengerAccountPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [smsNotification, setSmsNotification] = useState(false);

  const populateForm = (data: MyProfileDto) => {
    setProfile(data);
    setFullName(data.fullName ?? "");
    setPhone(data.phone ?? "");
    setAddress(data.address ?? "");
    setDob(data.dob ?? "");
    setEmailNotification(
      data.emailNotification ?? data.settings?.emailNotification ?? false,
    );
    setSmsNotification(
      data.smsNotification ?? data.settings?.smsNotification ?? false,
    );
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await profileApi.getMyProfile();
        if (cancelled) return;
        populateForm(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải profile";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      setError(null);
      await profileApi.uploadAvatar(file);
      const refreshed = await profileApi.getMyProfile();
      populateForm(refreshed);
      notifyProfileUpdated(refreshed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload avatar thất bại";
      setError(message);
    } finally {
      setIsSaving(false);
      // allow re-select same file
      event.target.value = "";
    }
  };

  const handleCancel = () => {
    setError(null);
    setFullName(profile?.fullName ?? "");
    setPhone(profile?.phone ?? "");
    setAddress(profile?.address ?? "");
    setDob(profile?.dob ?? "");
    setEmailNotification(
      profile?.emailNotification ?? profile?.settings?.emailNotification ?? false,
    );
    setSmsNotification(
      profile?.smsNotification ?? profile?.settings?.smsNotification ?? false,
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await profileApi.updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        dob,
      });

      await profileApi.updateMySettings({
        emailNotification,
        smsNotification,
      });

      const wantsPasswordChange =
        currentPassword.length > 0 || newPassword.length > 0 || confirmNewPassword.length > 0;

      if (wantsPasswordChange) {
        if (!currentPassword || !newPassword) {
          throw new Error("Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.");
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error("Xác nhận mật khẩu mới không khớp.");
        }

        await profileApi.updateMyPassword({
          oldPassword: currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }

      const refreshed = await profileApi.getMyProfile();
      populateForm(refreshed);
      notifyProfileUpdated(refreshed);

      window.alert("Đã lưu thay đổi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lưu thất bại";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Tài khoản | MetroNext</title>
      </Head>

      <div className="passenger-page-shell min-h-screen w-full bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)]">
        <div className="flex min-h-screen w-full">
          <PassengerSidebar />

          <main className="flex min-w-0 flex-1 flex-col">
            <PassengerHeader />

            <section className="flex-1 p-4 sm:p-8">
              <div className="mx-auto w-full max-w-[1200px] space-y-5">
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                {isLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    Đang tải profile...
                  </div>
                ) : null}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>Hành khách</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-900">Tài khoản</span>
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl">Cài đặt tài khoản</h1>
                  <p className="pt-1 text-sm text-slate-500">
                    Quản lý hồ sơ, bảo mật và phương thức thanh toán của bạn tại MetroNext.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Hồ sơ</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Đã xác thực 100%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Bảo mật</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Mức cao</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Phương thức</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">2 liên kết</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Hạng thành viên</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Gold</p>
                  </div>
                </div>

                <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2 text-slate-900">
                    <User className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold">Thông tin cá nhân</h2>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center">
                          <div className="relative shrink-0">
                            <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                              <img
                                className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                                src={profile?.avatarUrl ?? "https://placehold.co/128x128"}
                                alt="Avatar"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handlePickAvatar}
                              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white transition hover:bg-blue-700"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900">Ảnh đại diện</p>
                            <p className="text-xs text-slate-500">JPG, PNG hoặc GIF. Tối đa 5MB.</p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                1:1
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Khuyên dùng 512x512
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handlePickAvatar}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Thay đổi ảnh
                        </button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelected}
                    />

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Họ tên</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Email</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value={profile?.email ?? ""}
                          readOnly
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Số điện thoại</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </label>

                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-bold text-slate-700">Địa chỉ</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Ngày sinh</span>
                        <input
                          type="date"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold">Bảo mật</h2>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số để tăng mức độ an toàn.
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">Mật khẩu hiện tại</span>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">Mật khẩu mới</span>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">Xác nhận mật khẩu mới</span>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <h2 className="text-lg font-bold text-slate-900">Tùy chọn</h2>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-xl px-1">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Chế độ tối</p>
                          <p className="text-xs text-slate-500">Giao diện phù hợp ban đêm</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDarkMode((prev) => !prev)}
                          className={`relative h-6 w-11 rounded-full ${darkMode ? "bg-blue-600" : "bg-slate-200"}`}
                          aria-pressed={darkMode}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition ${darkMode ? "left-5" : "left-0.5"}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-1">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Thông báo email</p>
                          <p className="text-xs text-slate-500">Nhận cập nhật qua email</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailNotification((prev) => !prev)}
                          className={`relative h-6 w-11 rounded-full ${emailNotification ? "bg-blue-600" : "bg-slate-200"}`}
                          aria-pressed={emailNotification}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition ${emailNotification ? "left-5" : "left-0.5"}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl px-1">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Thông báo SMS</p>
                          <p className="text-xs text-slate-500">Nhận cập nhật qua số điện thoại</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSmsNotification((prev) => !prev)}
                          className={`relative h-6 w-11 rounded-full ${smsNotification ? "bg-blue-600" : "bg-slate-200"}`}
                          aria-pressed={smsNotification}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition ${smsNotification ? "left-5" : "left-0.5"}`}
                          />
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 text-slate-900">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold">Liên kết thanh toán</h2>
                    </div>

                    <div className="space-y-3">
                      {linkedPayments.map((payment) => {
                        const PaymentIcon = payment.icon;
                        return (
                          <div
                            key={payment.title}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${payment.tone}`}>
                                <PaymentIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{payment.title}</p>
                                <p className="truncate text-xs text-slate-500">{payment.subtitle}</p>
                              </div>
                            </div>
                            <button className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 py-2 text-sm font-bold text-slate-500">
                      <Plus className="h-3 w-3" />
                      <span>Thêm phương thức</span>
                    </button>
                  </section>
                </div>
              </div>
            </section>

            <div className="sticky bottom-20 z-10 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0px_-4px_10px_rgba(0,0,0,0.03)] backdrop-blur sm:px-8 lg:bottom-0">
              <div className="mx-auto flex w-full max-w-[1200px] flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCancel}
                  className="rounded-xl border border-slate-200 bg-white px-8 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)] hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </main>
        </div>
        <PassengerChatbotWidget />
      </div>
    </>
  );
}
