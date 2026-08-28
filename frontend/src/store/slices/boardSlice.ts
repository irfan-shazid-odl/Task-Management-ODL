import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Board view/filter state lifted out of the (previously 1500-line) board page,
// so it persists across navigation and the component stays presentational.
export type BoardViewMode = 'mine' | 'all' | string; // string = member id
export type BoardFilterMode = 'day' | 'month';

interface BoardState {
  viewMode: BoardViewMode;
  filterMode: BoardFilterMode;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  projectId: string; // 'all' | project id
  showTasksTable: boolean;
}

function todayIso() {
  // Note: computed at slice init on the client; SSR-safe fallback handled by hydration.
  try {
    return new Date().toLocaleDateString('en-CA');
  } catch {
    return '';
  }
}

const initialState: BoardState = {
  viewMode: 'mine',
  filterMode: 'day',
  date: todayIso(),
  month: todayIso().slice(0, 7),
  projectId: 'all',
  showTasksTable: true,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<BoardViewMode>) {
      state.viewMode = action.payload;
    },
    setFilterMode(state, action: PayloadAction<BoardFilterMode>) {
      state.filterMode = action.payload;
    },
    setDate(state, action: PayloadAction<string>) {
      state.date = action.payload;
    },
    setMonth(state, action: PayloadAction<string>) {
      state.month = action.payload;
    },
    setProjectId(state, action: PayloadAction<string>) {
      state.projectId = action.payload;
    },
    setShowTasksTable(state, action: PayloadAction<boolean>) {
      state.showTasksTable = action.payload;
    },
  },
});

export const {
  setViewMode,
  setFilterMode,
  setDate,
  setMonth,
  setProjectId,
  setShowTasksTable,
} = boardSlice.actions;
export default boardSlice.reducer;
