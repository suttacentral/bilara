import {
  FETCH_SUGGESTIONS, RECEIVE_SUGGESTIONS, UPDATE_REPLACE
} from '../actions/search.js';

export const searchReducer = (state = {suggestions: {}, search: {} }, action) => {
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
        case UPDATE_REPLACE:
            return {
                ...state,
                search: {
                    ...state.search,
                    replaceValue: action.replaceValue
                }
            }
        default:
            return state
    }
}