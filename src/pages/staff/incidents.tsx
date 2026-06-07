import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import IncidentManagement from "@components/organisms/IncidentShared/IncidentManagement";

function StaffIncidentsPage() {
  return (
    <>
      <Head>
        <title>Su co | MetroNext</title>
      </Head>
      <StaffLayout>
        <IncidentManagement mode="staff" />
      </StaffLayout>
    </>
  );
}

export default withAuth(StaffIncidentsPage, { allowedRoles: ["staff", "admin"] });
