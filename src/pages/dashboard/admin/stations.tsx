import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import StationList from "@components/organisms/StationManagement/StationList";

function StationsPage() {
  return (
    <AdminLayout title="Quản lý nhà ga | MetroNext">
      <StationList />
    </AdminLayout>
  );
}

export default withAuth(StationsPage, { allowedRoles: ["admin"] });
