import { useEffect } from "react";
import { useRouter } from "next/router";
import { withAuth } from "@components/templates/withAuth";

function PassengerPortal() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/passenger-page");
  }, [router]);

  return null;
}

export default withAuth(PassengerPortal, { allowedRoles: ["passenger"] });
