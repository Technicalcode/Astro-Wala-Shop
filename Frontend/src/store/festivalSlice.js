import { createSlice } from "@reduxjs/toolkit";
import { getActiveFestival, getUpcomingFestival } from "../data/festivals";

const getInitialState = () => {
  const today = new Date();
  const activeFestival = getActiveFestival(today);
  const upcoming = getUpcomingFestival(today);
  const showCountdown = !activeFestival && upcoming && upcoming.daysAway <= upcoming.festival.countdownFrom;

  return {
    activeFestival,
    upcoming,
    showCountdown,
  };
};

const festivalSlice = createSlice({
  name: "festival",
  initialState: getInitialState(),
  reducers: {
    refreshFestivals: (state) => {
      const today = new Date();
      state.activeFestival = getActiveFestival(today);
      state.upcoming = getUpcomingFestival(today);
      state.showCountdown = !state.activeFestival && state.upcoming && state.upcoming.daysAway <= state.upcoming.festival.countdownFrom;
    },
  },
});

export const { refreshFestivals } = festivalSlice.actions;

export const selectActiveFestival = (state) => state.festival.activeFestival;
export const selectUpcomingFestival = (state) => state.festival.upcoming;
export const selectShowCountdown = (state) => state.festival.showCountdown;

export default festivalSlice.reducer;
