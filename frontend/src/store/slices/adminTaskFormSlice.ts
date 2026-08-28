import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types';

export interface AdminTaskFormState {
  showTaskForm: boolean;
  creatingTask: boolean;
  editTaskId: string | null;

  newTaskProjectId: string;
  projectSearch: string;
  projectDropdownOpen: boolean;

  newTaskDescription: string;
  newTaskStatus: TaskStatus;
  newTaskPriority: TaskPriority;
  newTaskDeadline: string;
  newTaskLogDate: string;
  newTaskCategory: TaskCategory | '';
  newTaskEstimatedTime: string;

  newTaskRefDocId: string;
  docDropdownOpen: boolean;
  docSearch: string;

  newTaskAssignees: string[];
}

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

const initialState: AdminTaskFormState = {
  showTaskForm: false,
  creatingTask: false,
  editTaskId: null,
  
  newTaskProjectId: '',
  projectSearch: '',
  projectDropdownOpen: false,

  newTaskDescription: '',
  newTaskStatus: 'Todo',
  newTaskPriority: 'Low',
  newTaskDeadline: todayIsoDate(),
  newTaskLogDate: todayIsoDate(),
  newTaskCategory: '',
  newTaskEstimatedTime: '',

  newTaskRefDocId: '',
  docDropdownOpen: false,
  docSearch: '',

  newTaskAssignees: [],
};

const adminTaskFormSlice = createSlice({
  name: 'adminTaskForm',
  initialState,
  reducers: {
    setShowTaskForm(state, action: PayloadAction<boolean>) {
      state.showTaskForm = action.payload;
    },
    setCreatingTask(state, action: PayloadAction<boolean>) {
      state.creatingTask = action.payload;
    },
    setEditTaskId(state, action: PayloadAction<string | null>) {
      state.editTaskId = action.payload;
    },
    setNewTaskProjectId(state, action: PayloadAction<string>) {
      state.newTaskProjectId = action.payload;
    },
    setProjectSearch(state, action: PayloadAction<string>) {
      state.projectSearch = action.payload;
    },
    setProjectDropdownOpen(state, action: PayloadAction<boolean>) {
      state.projectDropdownOpen = action.payload;
    },
    setNewTaskDescription(state, action: PayloadAction<string>) {
      state.newTaskDescription = action.payload;
    },
    setNewTaskStatus(state, action: PayloadAction<TaskStatus>) {
      state.newTaskStatus = action.payload;
    },
    setNewTaskPriority(state, action: PayloadAction<TaskPriority>) {
      state.newTaskPriority = action.payload;
    },
    setNewTaskDeadline(state, action: PayloadAction<string>) {
      state.newTaskDeadline = action.payload;
    },
    setNewTaskLogDate(state, action: PayloadAction<string>) {
      state.newTaskLogDate = action.payload;
    },
    setNewTaskCategory(state, action: PayloadAction<TaskCategory | ''>) {
      state.newTaskCategory = action.payload;
    },
    setNewTaskEstimatedTime(state, action: PayloadAction<string>) {
      state.newTaskEstimatedTime = action.payload;
    },
    setNewTaskRefDocId(state, action: PayloadAction<string>) {
      state.newTaskRefDocId = action.payload;
    },
    setDocDropdownOpen(state, action: PayloadAction<boolean>) {
      state.docDropdownOpen = action.payload;
    },
    setDocSearch(state, action: PayloadAction<string>) {
      state.docSearch = action.payload;
    },
    setNewTaskAssignees(state, action: PayloadAction<string[]>) {
      state.newTaskAssignees = action.payload;
    },
    toggleAssignee(state, action: PayloadAction<string>) {
      const memberId = action.payload;
      if (state.newTaskAssignees.includes(memberId)) {
        state.newTaskAssignees = state.newTaskAssignees.filter((id) => id !== memberId);
      } else {
        state.newTaskAssignees.push(memberId);
      }
    },
    resetForm(state) {
      state.editTaskId = null;
      state.newTaskProjectId = '';
      state.projectSearch = '';
      state.projectDropdownOpen = false;
      state.newTaskDescription = '';
      state.newTaskStatus = 'Todo';
      state.newTaskPriority = 'Low';
      state.newTaskDeadline = todayIsoDate();
      state.newTaskLogDate = todayIsoDate();
      state.newTaskCategory = '';
      state.newTaskEstimatedTime = '';
      state.newTaskRefDocId = '';
      state.docDropdownOpen = false;
      state.docSearch = '';
      state.newTaskAssignees = [];
    }
  },
});

export const {
  setShowTaskForm,
  setCreatingTask,
  setEditTaskId,
  setNewTaskProjectId,
  setProjectSearch,
  setProjectDropdownOpen,
  setNewTaskDescription,
  setNewTaskStatus,
  setNewTaskPriority,
  setNewTaskDeadline,
  setNewTaskLogDate,
  setNewTaskCategory,
  setNewTaskEstimatedTime,
  setNewTaskRefDocId,
  setDocDropdownOpen,
  setDocSearch,
  setNewTaskAssignees,
  toggleAssignee,
  resetForm
} = adminTaskFormSlice.actions;

export default adminTaskFormSlice.reducer;
