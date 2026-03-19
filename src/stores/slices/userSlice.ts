import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UserState = {
  isLoggedIn: boolean;
  name: string;
};

const initialState: UserState = {
  isLoggedIn: false,
  name: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ name: string }>) {
      state.isLoggedIn = true;
      state.name = action.payload.name;
    },
    clearUser(state) {
      state.isLoggedIn = false;
      state.name = "";
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
