import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import ScheduleManagement from "@components/organisms/ScheduleManagement/ScheduleManagement";

function SchedulesPage() {
  return (
    <AdminLayout title="Quản lý lịch tàu | MetroNext">
      <ScheduleManagement />
    </AdminLayout>
  );
}

export default withAuth(SchedulesPage, { allowedRoles: ["admin"] });
