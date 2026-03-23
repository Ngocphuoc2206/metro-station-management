import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import ScannerTool from "@components/organisms/ScannerTool/ScannerTool";

function ScannerPortal() {
  return (
    <>
      <Head>
        <title>Gate Scanner Tool | MetroNext</title>
      </Head>
      <ScannerTool />
    </>
  );
}

// staff và admin đều có thể dùng scanner tool
export default withAuth(ScannerPortal, { allowedRoles: ["staff", "admin"] });
