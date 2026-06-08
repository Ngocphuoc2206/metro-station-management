import { useState, useEffect, useCallback, useMemo } from "react";
import { userApi } from "@features/user/userApi";
import { User } from "@features/user/userTypes";
import UserList from "./UserList";
import UserFormModal from "./UserFormModal";
import { stationApi } from "@features/station/stationApi";
import { Station } from "@features/station/stationTypes";

export default function UserManagement() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Stations for assignment
  const [stations, setStations] = useState<Station[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const users = await userApi.getUsers();
      setData(users);
      // Giả lập lấy danh sách ga
      const stasResult = await stationApi.getStations({}, 1, 100);
      setStations(stasResult.data);
    } catch (e) {
      console.error(e);
      alert("Lỗi tải thông tin quản lý");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived filtered data
  const filteredData = useMemo(() => {
    return data.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [data, searchTerm, roleFilter, statusFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateOrUpdate = async (formData: any) => {
    try {
      // Map station ID to name for UI
      if (formData.assignedStationId) {
        const station = stations.find(
          (s) => s.id === formData.assignedStationId,
        );
        if (station) formData.assignedStationName = station.name;
      } else {
        formData.assignedStationName = undefined;
      }

      if (editingUser) {
        const updated = await userApi.updateUser(editingUser.id, formData);
        setData((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        // Optional: show toast
      } else {
        const created = await userApi.createUser(formData);
        setData((prev) => [created, ...prev]);
        // Bắn alert show pass hoặc gửi mail
        alert(
          `Tạo người dùng thành công!\nMật khẩu tạm thời: ${formData.tempPassword}\nVui lòng gửi mật khẩu này cho người dùng.`,
        );
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu thông tin");
    }
  };

  const handleResetPassword = async (user: User) => {
    if (
      confirm(
        `Bạn có chắc chắn muốn đặt lại mật khẩu cho ${user.email}?\nMật khẩu mới sẽ được tạo ngẫu nhiên.`,
      )
    ) {
      alert(
        `Đã đặt lại mật khẩu cho ${user.email}. Một email hướng dẫn đã được gửi đi.`,
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2 tracking-tight">
            Quản lý người dùng
          </h1>
          <nav className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <span className="hover:text-gray-600 transition-colors cursor-pointer">
              Admin
            </span>
            <span>›</span>
            <span className="text-gray-900">Người dùng</span>
          </nav>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md sm:w-auto"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm người dùng
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <UserList
          data={filteredData}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={(u) => {
            setEditingUser(u);
            setIsModalOpen(true);
          }}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSubmit={handleCreateOrUpdate}
        mockStations={stations}
      />
    </div>
  );
}
