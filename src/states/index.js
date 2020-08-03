import { combineReducers } from 'redux';

import { reduce as WorkspaceStatsReducer } from './WorkspaceStats';

// Register your redux store under a unique namespace
export const namespace = 'realtime-queues-roles-filter';

// Combine the reducers
export default combineReducers({
  workspaceStats: WorkspaceStatsReducer
});
