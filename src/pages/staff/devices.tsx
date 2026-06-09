import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import DeviceDashboard from "@components/organisms/DeviceDashboard/DeviceDashboard";

function StaffDevicesPage() {
  return (
    <>
      <Head>
        <title>Quản lý thiết bị | MetroNext</title>
      </Head>
      <StaffLayout wide>
        <DeviceDashboard />
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffDevicesPage, { allowedRoles: ["staff", "admin"] });
