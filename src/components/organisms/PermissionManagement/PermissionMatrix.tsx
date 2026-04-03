import { PermissionModule, RoleDetail } from "@features/permission/permissionTypes";

interface Props {
  modules: PermissionModule[];
  roles: RoleDetail[];
  localPermissions: Record<string, Set<string>>; // roleId -> Set of moduleIds
  onTogglePermission: (roleId: string, moduleId: string) => void;
  selectedRoleId: string | null;
  onRoleClick: (roleId: string) => void;
}

export default function PermissionMatrix({
  modules,
  roles,
  localPermissions,
  onTogglePermission,
  selectedRoleId,
  onRoleClick,
}: Props) {
  
  // Icon placeholder logic (trong thực tế có thể dùng mảng icon map theo module id)
  const getIcon = (id: string) => {
    switch(id) {
      case "stations": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />;
      case "routes": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />;
      case "tickets": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />;
      case "reports": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case "audit": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case "users": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
      case "profile": return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
      default: return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 min-w-[300px]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block">Mô-đun hệ thống</span>
              </th>
              {roles.map((role) => (
                <th 
                  key={role.id} 
                  className={`px-4 py-5 border-b border-gray-100 text-center transition-colors cursor-pointer group ${
                    selectedRoleId === role.id ? "bg-blue-50" : "bg-gray-50/50 hover:bg-gray-50"
                  }`}
                  onClick={() => onRoleClick(role.id)}
                >
                  <div className="flex flex-col flex-wrap md:flex-row items-center justify-center gap-1.5 md:gap-2">
                    <span className={`text-sm font-bold ${
                      selectedRoleId === role.id ? "text-blue-700" : "text-gray-900 group-hover:text-blue-600"
                    }`}>
                      {role.name}
                    </span>
                    {/* Badge */}
                    {role.id === "admin" && (
                       <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] uppercase font-bold tracking-wider">Mạnh nhất</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 font-medium hidden md:block">
                     (Click xem chi tiết)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {modules.map((mod) => (
              <tr key={mod.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {getIcon(mod.id)}
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{mod.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[280px]">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                </td>
                
                {roles.map((role) => {
                  const isChecked = localPermissions[role.id]?.has(mod.id);
                  const isAdmin = role.id === "admin";
                  
                  return (
                    <td 
                      key={`${role.id}-${mod.id}`} 
                      className={`px-4 py-5 text-center ${selectedRoleId === role.id ? "bg-blue-50/30" : ""}`}
                    >
                      <label className={`relative inline-flex items-center justify-center cursor-pointer ${isAdmin ? "cursor-not-allowed opacity-70" : ""}`}>
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={isChecked}
                          onChange={() => !isAdmin && onTogglePermission(role.id, mod.id)}
                          disabled={isAdmin} // Không cho phép bỏ quyền admin
                        />
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          isChecked 
                            ? "bg-blue-500 border-blue-500 peer-hover:bg-blue-600" 
                            : "bg-white border-gray-300 peer-hover:border-blue-400"
                        }`}>
                          {isChecked && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
