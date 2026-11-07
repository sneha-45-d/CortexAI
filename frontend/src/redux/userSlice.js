
import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    authChecked: false,
  },
  reducers: {
    setUserdata: (state, action) => {
      state.userData = action.payload;
    },
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload;
    },
  },
});

export const { setUserdata, setAuthChecked } = userSlice.actions;
export default userSlice.reducer;
