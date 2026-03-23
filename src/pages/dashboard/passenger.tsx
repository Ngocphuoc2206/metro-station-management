import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import PassengerDashboard from "@components/organisms/PassengerDashboard/PassengerDashboard";

function PassengerPortal() {
  return (
    <>
      <Head>
        <title>Passenger Portal | MetroNext</title>
      </Head>
      <PassengerDashboard />
    </>
  );
}

export default withAuth(PassengerPortal, { allowedRoles: ["passenger"] });
