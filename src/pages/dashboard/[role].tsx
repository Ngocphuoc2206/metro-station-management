import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/index";

/** Redirect shim — maps old /dashboard/[role] to new static portal paths */
const PORTAL_PATHS: Record<string, string> = {
  passenger: "/passenger-page",
  staff: "/staff",
  admin: "/dashboard/admin",
  scanner: "/dashboard/scanner",
};

export default function DashboardRedirect() {
  const router = useRouter();
  const { role } = useSelector((state: RootState) => state.userReducer);
  const { role: urlRole } = router.query;

  useEffect(() => {
    const target = typeof urlRole === "string" ? PORTAL_PATHS[urlRole] : null;
    if (target) {
      router.replace(target);
    } else if (role && PORTAL_PATHS[role]) {
      router.replace(PORTAL_PATHS[role]);
    } else {
      router.replace("/");
    }
  }, [urlRole, role, router]);

  return null;
}

