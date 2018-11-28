import { GET_BROWSE_DATA } from '../actions/browse.js';

export const browse = (state={}, action) => {
  if (action.type == GET_BROWSE_DATA) {
    return {tree: action.data}
  }
  return state
}