import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import AdminIncidentDashboard from "@components/organisms/AdminIncidentDashboard/AdminIncidentDashboard";

function AdminIncidentsPage() {
  return (
    <AdminLayout title="Duyệt sự cố | MetroNext Admin">
      <AdminIncidentDashboard />
    </AdminLayout>
  );
}

export default withAuth(AdminIncidentsPage, { allowedRoles: ["admin"] });
