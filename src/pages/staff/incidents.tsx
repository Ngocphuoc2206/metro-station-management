import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import IncidentDashboard from "@components/organisms/IncidentDashboard/IncidentDashboard";

function StaffIncidentsPage() {
  return (
    <>
      <Head>
        <title>Quản lý sự cố | MetroNext</title>
      </Head>
      <StaffLayout>
        <IncidentDashboard />
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffIncidentsPage, { allowedRoles: ["staff", "admin"] });
