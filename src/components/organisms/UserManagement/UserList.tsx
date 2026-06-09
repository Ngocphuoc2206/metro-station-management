import { useState } from "react";
import { User, UserRole } from "@features/user/userTypes";

interface Props {
  data: User[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  onCreate: () => void;
}

export default function UserList({
  data,
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onCreate,
}: Props) {
  const [appliedSearch, setAppliedSearch] = useState(searchTerm);
  const [appliedRole, setAppliedRole] = useState(roleFilter);
  const [appliedStatus, setAppliedStatus] = useState(statusFilter);

  const handleSearch = () => {
    onSearchChange(appliedSearch);
    onRoleFilterChange(appliedRole);
    onStatusFilterChange(appliedStatus);
  };

  const handleRoleChange = (val: string) => {
    setAppliedRole(val);
  };

  const handleStatusChange = (val: string) => {
    setAppliedStatus(val);
  };

  // Role Base Display Properties
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Admin</span>;
      case "staff":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Staff</span>;
      case "scanner":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Scanner</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Passenger</span>;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden flex flex-col gap-0">
      {/* FILTER HEADER */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-gray-50/30">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={appliedSearch}
            onChange={(e) => setAppliedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Dropdowns & Buttons */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-end">
          {/* Vai trò */}
          <div className="relative w-full md:w-48 flex items-center bg-white border border-gray-200 rounded-xl pl-4 pr-1 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-colors">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Vai trò:</span>
            <select
              value={appliedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full py-2.5 pl-2 pr-8 bg-transparent text-sm font-bold text-gray-900 appearance-none focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="scanner">Scanner</option>
              <option value="passenger">Passenger</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="relative w-full md:w-[210px] flex items-center bg-white border border-gray-200 rounded-xl pl-4 pr-1 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-colors">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Trạng thái:</span>
            <select
              value={appliedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full py-2.5 pl-2 pr-8 bg-transparent text-sm font-bold text-gray-900 appearance-none focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Search Button (replaces filter icon) */}
          <button 
            onClick={handleSearch}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-xl transition-colors text-white font-bold flex items-center gap-2 shrink-0 whitespace-nowrap" 
            title="Tìm kiếm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
          
          <button
            onClick={onCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md w-full md:w-auto shrink-0 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="app-table-scroll">
        <table className="app-table text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[25%]">Người dùng</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[25%]">Email</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[15%]">Vai trò</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[12%]">Trạng thái</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[13%]">Đăng nhập cuối</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[120px] text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Không tìm thấy người dùng nào phù hợp.
                </td>
              </tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
                  {/* NGƯỜI DÙNG */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  
                  {/* EMAIL */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-blue-600 truncate block max-w-[200px]" title={user.email}>{user.email}</span>
                  </td>

                  {/* VAI TRÒ */}
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>

                  {/* TRẠNG THÁI */}
                  <td className="px-6 py-4">
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-gray-200 text-gray-500 bg-gray-50 uppercase tracking-wider">
                         <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Inactive
                      </span>
                    )}
                  </td>
                  
                  {/* ĐĂNG NHẬP CUỐI */}
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500 block max-w-[100px] leading-tight">
                       {user.lastLogin || "Chưa đăng nhập"}
                    </span>
                  </td>

                  {/* THAO TÁC */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-start gap-0">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        title="Chỉnh sửa"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* PAGINATION (MOCK) */}
      <div className="app-table-summary bg-gray-50/30">
        <span className="text-xs text-gray-500">Hiển thị 1 - {data.length} của {data.length} người dùng</span>
        <div className="flex items-center gap-1">
          <button className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50" disabled>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">1</button>
          <button className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50" disabled>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
