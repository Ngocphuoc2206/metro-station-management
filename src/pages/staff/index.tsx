import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffDashboard from "@components/organisms/StaffDashboard/StaffDashboard";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";

function StaffPortal() {
  return (
    <>
      <Head>
        <title>Station Staff Portal | MetroNext</title>
      </Head>
      <StaffLayout>
        <StaffDashboard />
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffPortal, { allowedRoles: ["staff"] });
