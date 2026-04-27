import { withAuth } from "@components/templates/withAuth";
import PermissionManagement from "@components/organisms/PermissionManagement/PermissionManagement";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";

function AdminPermissionsPage() {
  return (
    <AdminLayout title="Phân quyền & Vai trò | MetroNext">
      <PermissionManagement />
    </AdminLayout>
  );
}

// Bọc HOC để yêu cầu đăng nhập và có quyền admin
export default withAuth(AdminPermissionsPage, { allowedRoles: ["admin"] });
