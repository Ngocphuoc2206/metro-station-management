import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import ReportManagement from "@components/organisms/Reports/ReportManagement";

function AdminReportsPage() {
  return (
    <AdminLayout title="Báo cáo & Phân tích | MetroNext">
      <ReportManagement />
    </AdminLayout>
  );
}

export default withAuth(AdminReportsPage, { allowedRoles: ["admin"] });
