import {
  SET_PUBLISH_DATA,
  RESET_DIALOG_DATA,
  CLOSE_DIALOG
} from '../actions/dialog.js';
import {
  deepClone
} from '../util.js';

const defaultState = {
  dialogType: null,
  publishData: {
    path: null,
    status: null,
    url: null,
    PRUrl: null,
    error: null
  }
}

const dialogReducer = (state = defaultState, action) => {
  switch (action.type) {
    case CLOSE_DIALOG:
      return {
        ...state,
        dialogType: null
      }
      case RESET_DIALOG_DATA:
        return deepClone(defaultState)
      case SET_PUBLISH_DATA:
        console.log(state);
        return {
          dialogType: 'PUBLISH',
            publishData: {
              ...state.publishData,
              ...action.data
            }
        }

      default:
        return state
  }
}

export default dialogReducer;