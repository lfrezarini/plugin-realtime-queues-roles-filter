import { combineReducers } from 'redux';

import { reduce as WorkspaceStatsReducer } from './WorkspaceStats';
import { reduce as QueuesStatsReducer } from './QueuesStats';
import { reduce as LastActionReducer } from './LastAction';


// Register your redux store under a unique namespace
export const namespace = 'realtime-queues-roles-filter';

// Combine the reducers
export default combineReducers({
  workspaceStats: WorkspaceStatsReducer,
  queuesStats: QueuesStatsReducer,
  view: LastActionReducer
});
