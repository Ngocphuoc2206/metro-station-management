import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LayoutState = {
  primaryColor: string;
};

const initialState: LayoutState = {
  primaryColor: "#2563eb",
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setPrimaryColor(state, action: PayloadAction<string>) {
      state.primaryColor = action.payload;
    },
  },
});

export const { setPrimaryColor } = layoutSlice.actions;
export default layoutSlice.reducer;
