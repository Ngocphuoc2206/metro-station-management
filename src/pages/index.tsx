import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/index";

const ROLE_PATHS: Record<string, string> = {
  passenger: "/dashboard/passenger",
  staff: "/dashboard/staff",
  admin: "/dashboard/admin",
};

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, role } = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    if (isLoggedIn && role && ROLE_PATHS[role]) {
      router.replace(ROLE_PATHS[role]);
    } else {
      router.replace("/auth/login");
    }
  }, [isLoggedIn, role, router]);

  return null;
}


