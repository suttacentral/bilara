import { GET_BROWSE_DATA, UPDATE_PATH } from '../actions/browse.js';

import { set as dotPropSet } from '../dot-prop.js';

export const browse = (state={}, action) => {
  switch (action.type) {
    case GET_BROWSE_DATA: 
      return {tree: action.data}
    
      case UPDATE_PATH:
        return dotPropSet(state, action.path, action.value)
      default:
        return state
  }
}