const SET_QUEUES_LIST = `plugin/queue-stats/SET_QUEUES_LIST`;
const SET_TASKS_BY_QUEUES = `plugin/queue-stats/SET_TASKS_BY_QUEUES`;

const initialState = {
  queuesList: new Map(),
  tasksByQueues: new Map()
};

export class Actions {
  static setQueuesList = (payload) => ({ type: SET_QUEUES_LIST, payload });
  static setTasksByQueues = (payload) => ({ type: SET_TASKS_BY_QUEUES, payload });
}

export const reduce = (state = initialState, action) => {
  switch(action.type) {
    case SET_QUEUES_LIST: {
      return {
        ...state,
        queuesList: action.payload
      }
    }
    case SET_TASKS_BY_QUEUES: {
      return {
        ...state,
        tasksByQueues: action.payload
      }
    }
    default:
      return state;
  }
}
