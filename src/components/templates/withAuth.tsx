import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import type { ComponentType } from "react";
import type { RootState } from "@stores/index";
import type { UserRole } from "@stores/slices/userSlice";

type WithAuthOptions = {
  /** Nếu không truyền → chỉ cần đăng nhập, không cần role cụ thể */
  allowedRoles?: UserRole[];
};

/**
 * HOC bảo vệ route phía client.
 * - Chưa đăng nhập → redirect /auth/login?redirectTo=<current>
 * - Đăng nhập nhưng sai role → redirect /unauthorized
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  function AuthGuard(props: P) {
    const router = useRouter();
    const { isLoggedIn, role } = useSelector(
      (state: RootState) => state.userReducer
    );

    useEffect(() => {
      if (!isLoggedIn) {
        router.replace(`/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      if (options.allowedRoles && role && !options.allowedRoles.includes(role)) {
        router.replace("/unauthorized");
      }
    }, [isLoggedIn, role, router]);

    // Chưa login hoặc sai role → không render
    if (!isLoggedIn) return null;
    if (options.allowedRoles && role && !options.allowedRoles.includes(role)) return null;

    return <WrappedComponent {...props} />;
  }

  AuthGuard.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;
  return AuthGuard;
}
