import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "passenger" | "staff" | "admin" | "scanner";

type UserState = {
  isLoggedIn: boolean;
  name: string;
  email: string;
  role: UserRole | null;
  token: string | null;
};

const initialState: UserState = {
  isLoggedIn: false,
  name: "",
  email: "",
  role: null,
  token: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{
        name: string;
        email: string;
        role: UserRole;
        token: string;
      }>
    ) {
      state.isLoggedIn = true;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.token = action.payload.token;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.name = "";
      state.email = "";
      state.role = null;
      state.token = null;
    },
    // Keep legacy actions for backwards compatibility
    setUser(state, action: PayloadAction<{ name: string }>) {
      state.isLoggedIn = true;
      state.name = action.payload.name;
    },
    clearUser(state) {
      state.isLoggedIn = false;
      state.name = "";
      state.email = "";
      state.role = null;
      state.token = null;
    },
  },
});

export const { loginSuccess, logout, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
