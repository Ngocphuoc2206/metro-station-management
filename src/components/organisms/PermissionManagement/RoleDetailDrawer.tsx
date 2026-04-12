import { RoleDetail } from "@features/permission/permissionTypes";

interface Props {
  role: RoleDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleId: string) => void;
  isSaving: boolean;
  hasChanges: boolean;
}

export default function RoleDetailDrawer({ role, isOpen, onClose, onSave, isSaving, hasChanges }: Props) {
  if (!isOpen || !role) return null;

  return (
    <>
      {/* Backdrop for mobile (optional) */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />

      <div className={`fixed lg:relative top-0 right-0 h-screen lg:h-[calc(100vh-6rem)] w-[85%] max-w-[400px] lg:w-full bg-white shadow-2xl lg:shadow-none z-50 flex flex-col transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} lg:rounded-2xl border border-gray-100 overflow-hidden`}>
        
        {/* Header Drawer */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-blue-50/30 lg:rounded-t-2xl">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cấu hình vai trò</h3>
            <h2 className="text-2xl font-bold text-blue-600 leading-tight">{role.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Mô tả */}
          <div>
             <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Mô tả</h4>
             <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 border border-gray-100 p-4 rounded-xl">
               {role.description}
             </p>
          </div>

          {/* Quyền định dang mặc định (chỉ hiển thị) */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              Bộ quyền cơ sở <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px]">Cố định</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                <span className="text-sm font-semibold text-gray-700">Xem Hồ sơ cá nhân</span>
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                <span className="text-sm font-semibold text-gray-400">Can thiệp Database</span>
                <span className="text-gray-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Thống kê */}
          <div>
             <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Thông tin hệ thống</h4>
             <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 text-sm">
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-gray-500 font-medium">Ngày tạo:</span>
                  <span className="font-semibold text-gray-900">{role.createdDate}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-gray-500 font-medium">Người tạo:</span>
                  <span className="font-semibold text-gray-900">{role.creator}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-gray-500 font-medium">Số user sở hữu:</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{(role.userCount).toLocaleString()} người</span>
                </div>
             </div>
          </div>

        </div>

        {/* Footer Fixed */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 lg:rounded-b-2xl">
           <button 
             onClick={onClose}
             className="px-6 py-3 flex-1 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
           >
             Đóng
           </button>
           <button 
             onClick={() => onSave(role.id)}
             disabled={!hasChanges || isSaving}
             className="px-6 py-3 flex-1 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
           >
             {isSaving ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
             ) : "Cập nhật quyền"}
           </button>
        </div>

      </div>
    </>
  );
}
