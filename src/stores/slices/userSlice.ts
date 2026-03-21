import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "passenger" | "staff" | "admin";

type UserState = {
  isLoggedIn: boolean;
  name: string;
  email: string;
  role: UserRole | null;
};

const initialState: UserState = {
  isLoggedIn: false,
  name: "",
  email: "",
  role: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{ name: string; email: string; role: UserRole }>
    ) {
      state.isLoggedIn = true;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.name = "";
      state.email = "";
      state.role = null;
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
    },
  },
});

export const { loginSuccess, logout, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
