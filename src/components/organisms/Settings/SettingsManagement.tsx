import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SettingsSection from "./SettingsSection";
import SettingsToggle from "./SettingsToggle";

// Types
export interface SystemConfig {
  systemName: string;
  language: string;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyEmergency: boolean;
  paymentMomo: boolean;
  paymentZalo: boolean;
  paymentVietQR: boolean;
  security2FA: boolean;
  securityAutoLogout: boolean;
  maintenanceMode: boolean;
}

// Giả lập Initial State từ Server
const INITIAL_CONFIG: SystemConfig = {
  systemName: "MetroNext Admin System",
  language: "vi",
  notifyEmail: true,
  notifyPush: true,
  notifyEmergency: true,
  paymentMomo: true,
  paymentZalo: false,
  paymentVietQR: true,
  security2FA: true,
  securityAutoLogout: false,
  maintenanceMode: false,
};

export default function SettingsManagement() {
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ systemName?: string }>({});

  // Detect changes
  useEffect(() => {
    const isChanged = JSON.stringify(config) !== JSON.stringify(INITIAL_CONFIG);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasChanges(isChanged);

    // Auto-clear error if user types
    if (config.systemName.trim() && errors.systemName) {
      setErrors({});
    }
  }, [config, errors]);

  const handleChange = <K extends keyof SystemConfig>(
    key: K,
    value: SystemConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setConfig(INITIAL_CONFIG);
    setErrors({});
  };

  const handleSave = async () => {
    // Validation
    if (!config.systemName.trim()) {
      setErrors({ systemName: "Tên hệ thống không được để trống!" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);

    // Simulate API Call
    await new Promise((res) => setTimeout(res, 800));

    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-sm">Cập nhật thành công!</span>
        <span className="text-xs text-gray-600">
          Cấu hình hệ thống đã được lưu lại.
        </span>
      </div>,
      { duration: 3000 },
    );

    // Cập nhật lại gốc (Giả lập update server)
    Object.assign(INITIAL_CONFIG, config);
    setHasChanges(false);
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 relative pb-28 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Cài đặt hệ thống
        </h1>
      </div>

      {/* Thông tin chung */}
      <SettingsSection
        title="Thông tin chung"
        description="Cấu hình các thông tin định danh cơ bản của hệ thống MetroNext."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
              Tên hệ thống
            </label>
            <input
              type="text"
              value={config.systemName}
              onChange={(e) => handleChange("systemName", e.target.value)}
              className={`w-full px-4 py-3 bg-gray-50 border text-sm rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-gray-800 ${errors.systemName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`}
            />
            {errors.systemName && (
              <p className="text-xs text-red-500 font-bold mt-2">
                {errors.systemName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
              Ngôn ngữ mặc định
            </label>
            <select
              value={config.language}
              onChange={(e) => handleChange("language", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-gray-800 appearance-none cursor-pointer"
            >
              <option value="vi">Tiếng Việt (Vietnam)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3">
            Logo đơn vị
          </label>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Thay đổi Logo
            </button>
            <span className="text-xs text-gray-500 font-medium ml-2 relative top-0.5">
              Khuyên dùng PNG hoặc SVG, tối thiểu 200x200px.
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* Thông báo */}
      <SettingsSection title="Thông báo">
        <SettingsToggle
          title="Thông báo qua Email"
          description="Gửi các báo cáo hàng ngày và cảnh báo hệ thống tới email quản trị."
          checked={config.notifyEmail}
          onChange={(v) => handleChange("notifyEmail", v)}
        />
        <SettingsToggle
          title="Thông báo đẩy (Push)"
          description="Nhận thông báo thời gian thực trên trình duyệt web."
          checked={config.notifyPush}
          onChange={(v) => handleChange("notifyPush", v)}
        />
        <SettingsToggle
          title="Cảnh báo sự cố khẩn cấp"
          description="Ưu tiên hiển thị và thông báo ngay lập tức các sự cố nghiêm trọng."
          checked={config.notifyEmergency}
          onChange={(v) => handleChange("notifyEmergency", v)}
        />
      </SettingsSection>

      {/* Tích hợp thanh toán */}
      <SettingsSection title="Tích hợp thanh toán">
        <SettingsToggle
          title="Cổng thanh toán MoMo"
          description="Tích hợp ví điện tử MoMo để mua vé."
          checked={config.paymentMomo}
          onChange={(v) => handleChange("paymentMomo", v)}
          icon={
            <div className="w-full h-full rounded-full bg-[#A50064] text-white flex items-center justify-center font-black text-[10px]">
              MoMo
            </div>
          }
        />
        <SettingsToggle
          title="ZaloPay"
          description="Thanh toán nhanh qua ứng dụng ZaloPay."
          checked={config.paymentZalo}
          onChange={(v) => handleChange("paymentZalo", v)}
          icon={
            <div className="w-full h-full rounded-full bg-[#0068FF] text-white flex items-center justify-center font-black text-[10px]">
              Zalo
            </div>
          }
        />
        <SettingsToggle
          title="VietQR"
          description="Chuyển khoản liên ngân hàng qua mã QR NAPAS247."
          checked={config.paymentVietQR}
          onChange={(v) => handleChange("paymentVietQR", v)}
          icon={
            <div className="w-full h-full rounded-full bg-[#E51C24] text-white flex items-center justify-center font-bold text-[10px]">
              QR
            </div>
          }
        />
      </SettingsSection>

      {/* Bảo mật */}
      <SettingsSection title="Bảo mật">
        <SettingsToggle
          title="Xác thực 2 yếu tố (2FA)"
          description="Yêu cầu mã xác thực khi đăng nhập vào hệ thống Admin."
          checked={config.security2FA}
          onChange={(v) => handleChange("security2FA", v)}
        />
        <SettingsToggle
          title="Tự động đăng xuất khi treo máy"
          description="Tự động đăng xuất sau 30 phút không hoạt động."
          checked={config.securityAutoLogout}
          onChange={(v) => handleChange("securityAutoLogout", v)}
        />
      </SettingsSection>

      {/* Vận hành */}
      <SettingsSection title="Vận hành" danger>
        <SettingsToggle
          title="Chế độ bảo trì (Maintenance Mode)"
          description="CẢNH BÁO: KHI KÍCH HOẠT, TẤT CẢ CÁC GIAO DIỆN NGƯỜI DÙNG (WEBSITE, APP) SẼ TẠM NGƯNG HOẠT ĐỘNG. CHỈ TÀI KHOẢN ADMIN MỚI CÓ THỂ TRUY CẬP HỆ THỐNG."
          checked={config.maintenanceMode}
          onChange={(v) => handleChange("maintenanceMode", v)}
          danger
        />
      </SettingsSection>

      {/* Sticky Action Bar */}
      <div
        className={`fixed bottom-0 left-0 lg:left-64 right-0 p-4 border-t border-gray-200 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] flex justify-end gap-3 transition-transform duration-300 z-50 ${hasChanges ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="max-w-4xl w-full mx-auto px-4 xl:px-0 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy thay đổi
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 min-w-[140px] justify-center"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              "Lưu cấu hình"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
