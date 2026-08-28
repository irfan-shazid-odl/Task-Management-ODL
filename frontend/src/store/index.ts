import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import boardReducer from './slices/boardSlice';
import adminTaskFormReducer from './slices/adminTaskFormSlice';

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      board: boardReducer,
      adminTaskForm: adminTaskFormReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
