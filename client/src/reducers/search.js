import {
  FETCH_SUGGESTIONS, RECEIVE_SUGGESTIONS
} from '../actions/search.js';

export const searchReducer = (state = {suggestions: {} }, action) => {
    switch (action.type) {
        case FETCH_SUGGESTIONS:
            return {
                ...state,
                suggestions: {
                    ...state.suggestions,
                    [action.key]: null
                }
            }
        case RECEIVE_SUGGESTIONS:
            return {
                ...state,
                suggestions: {
                    ...state.suggestions,
                    [action.key]: action.data
                }
            }
            
        default:
            return state
    }
}