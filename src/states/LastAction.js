const VIEW_UPDATE_FILTER = 'VIEW_UPDATE_FILTER'

const initialState = {
    lastAction: {}
};

export class Actions {
  static viewUpdateFilter = () => ({ type: VIEW_UPDATE_FILTER });
}

export function reduce(state = initialState, action) {

  return {
    lastAction: action 
  }

}
