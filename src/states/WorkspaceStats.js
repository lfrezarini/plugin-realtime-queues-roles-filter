const SET_WORKSPACE_STATS = `plugin/queue-stats/SET_WORKSPACE_STATS`;

const initialState = {
  activity_statistics: {
    offline: {
      sid: process.env.REACT_APP_ACTIVITY_OFFLINE_SID,
      workers: 0,
      friendly_name: 'Offline'
    },
    break: {
      sid: process.env.REACT_APP_ACTIVITY_BREAK_SID,
      workers: 0,
      friendly_name: 'Break'
    },
    available: {
      sid: process.env.REACT_APP_ACTIVITY_AVAILABLE_SID,
      workers: 0,
      friendly_name: 'Available'
    },
    unavailable: {
      sid: process.env.REACT_APP_ACTIVITY_UNAVAILABLE_SID,
      workers: 0,
      friendly_name: 'Unavailable'
    }
  },
  tasks_by_priority: {},
  tasks_by_status: {
    assigned: 0,
    pending: 0,
    reserved: 0,
    wrapping: 0
  },
  tasks_list: new Map(),
  total_tasks: 0,
  total_workers: 0,
  workers_status: new Map(),
};

export class Actions {
  static setWorkspaceStats = (payload) => ({ type: SET_WORKSPACE_STATS, payload });
}

export const reduce = (state = initialState, action) => {
  switch(action.type) {
    case SET_WORKSPACE_STATS: {
      return {
        ...state,
        ...action.payload
      }
    }
    default:
      return state;
  }
}