import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import ShiftProfileDashboard from "@components/organisms/ShiftProfile/ShiftProfileDashboard";

function ShiftProfilePage() {
  return (
    <>
      <Head>
        <title>Hồ sơ ca trực | MetroNext Staff</title>
      </Head>
      <StaffLayout>
        <ShiftProfileDashboard />
      </StaffLayout>
    </>
  );
}

export default withAuth(ShiftProfilePage, { allowedRoles: ["staff"] });
