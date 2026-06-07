import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import IncidentManagement from "@components/organisms/IncidentShared/IncidentManagement";

function AdminIncidentsPage() {
  return (
    <AdminLayout title="Duyet su co | MetroNext Admin">
      <IncidentManagement mode="admin" />
    </AdminLayout>
  );
}

export default withAuth(AdminIncidentsPage, { allowedRoles: ["admin"] });
