import { useState, useEffect, useCallback, useMemo } from "react";
import { permissionApi } from "@features/permission/permissionApi";
import {
  PermissionModule,
  RoleDetail,
} from "@features/permission/permissionTypes";
import PermissionMatrix from "./PermissionMatrix";
import RoleDetailDrawer from "./RoleDetailDrawer";

export default function PermissionManagement() {
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // localPermissions: Mapping roleId -> Set(moduleIds)
  const [localPermissions, setLocalPermissions] = useState<
    Record<string, Set<string>>
  >({});

  // UI State
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedModules, fetchedRoles] = await Promise.all([
        permissionApi.getModules(),
        permissionApi.getRoles(),
      ]);
      setModules(fetchedModules);
      setRoles(fetchedRoles);

      // Khởi tạo state nội bộ để check
      const initialPerms: Record<string, Set<string>> = {};
      fetchedRoles.forEach((r) => {
        initialPerms[r.id] = new Set(r.permissions);
      });
      setLocalPermissions(initialPerms);
    } catch (e) {
      console.error(e);
      showToast("Lỗi tải thông tin phân quyền", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTogglePermission = (roleId: string, moduleId: string) => {
    if (roleId === "admin") return; // Admin luôn full quyền, ko cho phép sửa local

    setLocalPermissions((prev) => {
      const next = { ...prev };
      const newSet = new Set(next[roleId]);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      next[roleId] = newSet;
      return next;
    });
  };

  const selectedRoleOriginal = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const hasChanges = useMemo(() => {
    if (!selectedRoleOriginal || !localPermissions[selectedRoleOriginal.id])
      return false;

    const originalSet = new Set(selectedRoleOriginal.permissions);
    const currentSet = localPermissions[selectedRoleOriginal.id];

    if (originalSet.size !== currentSet.size) return true;
    for (const modId of currentSet) {
      if (!originalSet.has(modId)) return true;
    }
    return false;
  }, [selectedRoleOriginal, localPermissions]);

  const handleSaveRole = async (roleId: string) => {
    setIsSaving(true);
    try {
      const currentSet = localPermissions[roleId];
      const newPermissionsArray = Array.from(currentSet);

      const updatedRole = await permissionApi.updateRolePermissions(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roleId as any,
        newPermissionsArray,
      );

      // Cập nhật lại mảng roles gốc để tắt nút Save (vì đã đồng bộ)
      setRoles((prev) => prev.map((r) => (r.id === roleId ? updatedRole : r)));

      showToast(
        `Đã cập nhật phân quyền hệ thống cho ${updatedRole.name} thành công.`,
        "success",
      );
      setDrawerOpen(false); // Lưu xong tự đóng drawer cho gọn
    } catch (e) {
      console.error(e);
      showToast("Cập nhật quyền thất bại, vui lòng thử lại.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleClick = (roleId: string) => {
    setSelectedRoleId(roleId);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-6rem)]">
      {/* Cảnh báo Màn hình nhỏ */}
      <div className="block lg:hidden bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium">
        Bạn nên xoay ngang màn hình hoặc xem trên Máy tính để Hiển thị Ma trận
        rõ ràng nhất.
      </div>

      <div className="flex flex-col items-start gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Phân quyền & Vai trò
        </h1>
        <p className="text-sm text-gray-500">
          Thiết lập giới hạn truy cập và xem chi tiết theo nhóm người dùng hệ
          thống.
        </p>
      </div>

      {/* Info Banner theo Mockup */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Hướng dẫn:</h4>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            Tất cả các vai trò hiển thị theo dạng ma trận để dễ dàng so sánh.
            Cột &apos;Quản trị viên&apos; luôn giữ mức ưu tiên tối đa. Quản trị
            hệ thống vui lòng cân nhắc thận trọng khi cấp quyền mới cho các nhóm
            đặc thù. Click vào Tiêu đề Cột của từng vai trò để mở tuỳ chỉnh lưu
            lại thay đổi.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
        {/* VÙNG TRÁI: MA TRẬN */}
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <PermissionMatrix
              modules={modules}
              roles={roles}
              localPermissions={localPermissions}
              onTogglePermission={handleTogglePermission}
              selectedRoleId={selectedRoleId}
              onRoleClick={handleRoleClick}
            />
          )}
        </div>

        {/* VÙNG PHẢI: DRAWER CHI TIẾT */}
        {drawerOpen && (
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <RoleDetailDrawer
              role={selectedRoleOriginal}
              isOpen={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              onSave={handleSaveRole}
              isSaving={isSaving}
              hasChanges={hasChanges}
            />
          </div>
        )}
      </div>

      {/* TOAST THÔNG BÁO */}
      <div
        className={`fixed top-4 right-4 z-[60] transition-all duration-300 transform ${toast ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        {toast && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex gap-3 min-w-[320px] animate-in fade-in slide-in-from-top-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
            >
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div>
              <h4
                className={`text-sm font-bold mb-0.5 ${toast.type === "success" ? "text-gray-900" : "text-red-600"}`}
              >
                {toast.type === "success" ? "Thành công" : "Thất bại"}
              </h4>
              <p className="text-xs text-gray-500 leading-tight">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 p-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
