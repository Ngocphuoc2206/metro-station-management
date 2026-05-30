import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import AdminDeviceManagement from "@components/organisms/DeviceManagement/AdminDeviceManagement";

function AdminDevicesPage() {
  return (
    <AdminLayout title="Quản lý thiết bị | MetroNext">
      <AdminDeviceManagement />
    </AdminLayout>
  );
}

export default withAuth(AdminDevicesPage, { allowedRoles: ["admin"] });

