import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import AdminDashboard from "@components/organisms/AdminDashboard/AdminDashboard";

function AdminPortal() {
  return (
    <>
      <Head>
        <title>Admin Portal | MetroNext</title>
      </Head>
      <AdminDashboard />
    </>
  );
}

export default withAuth(AdminPortal, { allowedRoles: ["admin"] });
