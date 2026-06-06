import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import AdminIncidentDetail from "@components/organisms/AdminIncidentDashboard/AdminIncidentDetail";

function AdminIncidentDetailPage() {
  return (
    <AdminLayout title="Chi tiết sự cố | MetroNext Admin">
      <AdminIncidentDetail />
    </AdminLayout>
  );
}

export default withAuth(AdminIncidentDetailPage, { allowedRoles: ["admin"] });
