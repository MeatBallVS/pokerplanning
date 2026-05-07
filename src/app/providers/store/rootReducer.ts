import { combineReducers } from "@reduxjs/toolkit";

const appReducer = (state = {}) => state;

export const rootReducer = combineReducers({
  app: appReducer,
});
