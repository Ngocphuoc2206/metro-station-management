import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffDashboard from "@components/organisms/StaffDashboard/StaffDashboard";

function StaffPortal() {
  return (
    <>
      <Head>
        <title>Station Staff Portal | MetroNext</title>
      </Head>
      <StaffDashboard />
    </>
  );
}

export default withAuth(StaffPortal, { allowedRoles: ["staff"] });
