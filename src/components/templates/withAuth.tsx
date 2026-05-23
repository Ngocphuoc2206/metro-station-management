import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import type { ComponentType } from "react";
import type { RootState } from "@stores/index";
import type { UserRole } from "@stores/slices/userSlice";
import { introspectToken } from "@features/auth/authApi";
import { clearUser } from "@stores/slices/userSlice";

type WithAuthOptions = {
  /** Nếu không truyền → chỉ cần đăng nhập, không cần role cụ thể */
  allowedRoles?: UserRole[];
};

/**
 * HOC bảo vệ route phía client (FE-06).
 * - Chưa đăng nhập → redirect /auth/login?redirectTo=<current>
 * - Đăng nhập nhưng sai role → redirect /unauthorized
 * - Token hết hạn (server xác nhận) → xóa session, redirect login
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  function AuthGuard(props: P) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isLoggedIn, role } = useSelector(
      (state: RootState) => state.userReducer
    );
    const [tokenChecked, setTokenChecked] = useState(false);

    useEffect(() => {
      if (!isLoggedIn) {
        router.replace(`/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      if (options.allowedRoles && role && !options.allowedRoles.includes(role)) {
        router.replace("/unauthorized");
        return;
      }

      // ── FE-06: Introspect token với server ────────────────────────────────
      const token = typeof window !== "undefined"
        ? localStorage.getItem("authToken")
        : null;

      // Không có token nhưng Redux vẫn nghĩ đang đăng nhập → session lỗi
      if (!token) {
        dispatch(clearUser());
        router.replace(`/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      introspectToken(token).then((result) => {
        if (!result.valid) {
          // Token hết hạn → xóa session, redirect login
          dispatch(clearUser());
          localStorage.clear();
          sessionStorage.clear();
          router.replace(`/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        } else {
          setTokenChecked(true);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, role]);

    // Chưa login hoặc sai role → không render
    if (!isLoggedIn) return null;
    if (options.allowedRoles && role && !options.allowedRoles.includes(role)) return null;
    // Đang check introspect → chờ
    if (!tokenChecked) return null;

    return <WrappedComponent {...props} />;
  }

  AuthGuard.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;
  return AuthGuard;
}
