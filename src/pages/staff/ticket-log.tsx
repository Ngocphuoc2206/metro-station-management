import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import GateLogDashboard from "@components/organisms/GateLogDashboard/GateLogDashboard";

function StaffTicketLogPage() {
  return (
    <>
      <Head>
        <title>Nhật ký soát vé | MetroNext</title>
      </Head>
      <StaffLayout>
        <GateLogDashboard />
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffTicketLogPage, { allowedRoles: ["staff", "admin"] });
