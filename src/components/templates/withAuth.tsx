import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import type { ComponentType } from "react";
import type { RootState } from "@stores/index";
import type { UserRole } from "@stores/slices/userSlice";
import { introspectToken } from "@features/auth/authApi";
import { clearUser, loginSuccess } from "@stores/slices/userSlice";

type WithAuthOptions = {
  allowedRoles?: UserRole[];
};

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapRoleValue(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  const normalized = value.toUpperCase();
  if (normalized.includes("ADMIN")) return "admin";
  if (normalized.includes("STAFF")) return "staff";
  if (normalized.includes("SCANNER")) return "scanner";
  if (normalized.includes("PASSENGER")) return "passenger";

  return null;
}

function findRole(value: unknown): UserRole | null {
  if (!value) return null;

  const directRole = mapRoleValue(value);
  if (directRole) return directRole;

  if (Array.isArray(value)) {
    for (const item of value) {
      const role = findRole(item);
      if (role) return role;
    }
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return (
      findRole(item.roleName) ??
      findRole(item.roleId) ??
      findRole(item.name) ??
      findRole(item.authority)
    );
  }

  return null;
}

function restoreUserFromToken(token: string) {
  const payload = decodeJwtPayload(token);
  const role =
    findRole(payload?.roles) ??
    findRole(payload?.authorities) ??
    findRole(payload?.scope) ??
    findRole(payload?.role) ??
    findRole(payload?.roleName) ??
    findRole(payload?.roleId);

  if (!role) return null;

  const email =
    typeof payload?.email === "string"
      ? payload.email
      : typeof payload?.sub === "string"
        ? payload.sub
        : "";
  const name =
    typeof payload?.fullName === "string"
      ? payload.fullName
      : email
        ? email.split("@")[0]
        : "Metro user";

  return { name, email, role, token };
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {},
) {
  function AuthGuard(props: P) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isLoggedIn, role } = useSelector(
      (state: RootState) => state.userReducer,
    );
    const [tokenChecked, setTokenChecked] = useState(false);

    useEffect(() => {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("authToken")
        : null;

      if (!isLoggedIn) {
        if (token) {
          const restoredUser = restoreUserFromToken(token);
          if (restoredUser) {
            dispatch(loginSuccess(restoredUser));
            return;
          }
        }

        router.replace(`/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      if (options.allowedRoles && role && !options.allowedRoles.includes(role)) {
        router.replace("/unauthorized");
        return;
      }

      if (!token) {
        dispatch(clearUser());
        router.replace(`/auth/login?redirectTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      introspectToken(token).then((result) => {
        if (!result.valid) {
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

    if (!isLoggedIn) return null;
    if (options.allowedRoles && role && !options.allowedRoles.includes(role)) return null;
    if (!tokenChecked) return null;

    return <WrappedComponent {...props} />;
  }

  AuthGuard.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;
  return AuthGuard;
}
