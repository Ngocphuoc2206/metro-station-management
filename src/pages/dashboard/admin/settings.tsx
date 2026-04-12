import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import SettingsManagement from "@components/organisms/Settings/SettingsManagement";

function AdminSettingsPage() {
  return (
    <AdminLayout title="Cài đặt hệ thống | MetroNext">
      <SettingsManagement />
    </AdminLayout>
  );
}

export default withAuth(AdminSettingsPage, { allowedRoles: ["admin"] });
