import { useRouter } from "next/router";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@stores/index";
import { logout as logoutUserState } from "@stores/slices/userSlice";
import { clearClientSession } from "./session";

export const useLogout = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(() => {
    clearClientSession();
    dispatch(logoutUserState());
    router.push("/auth/login");
  }, [dispatch, router]);
};
