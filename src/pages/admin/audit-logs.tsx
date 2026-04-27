import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import AuditLogManagement from "@components/organisms/AuditLogs/AuditLogManagement";

function AdminAuditLogsPage() {
  return (
    <AdminLayout title="Nhật ký hoạt động | MetroNext">
      <AuditLogManagement />
    </AdminLayout>
  );
}

// Yêu cầu quyền admin
export default withAuth(AdminAuditLogsPage, { allowedRoles: ["admin"] });
