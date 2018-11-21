import 'merge' from 'deepmerge';

export const SEGMENT_CHANGED = 'SEGMENT:CHANGED';

export const SEGMENT_GAINED_FOCUS = 'SEGMENT:GAINED_FOCUS';


export function segmentChanged(segmentId, context, string) {
  return {
    type: SEGMENT_CHANGED,
    segmentId,
    context,
    string
}

export function gainedFocus(segmentId) {
  return {
    type: GAINED_FOCUS,
    segmentId
  }
}


const defaultState = {};


export const segmentReducer = (state = defaultState, action = {}) => {
  switch (action.type) {
    case 'SEGMENT_CHANGED':
      return merge(state, {action.context: {action.segmentId: action.string });
    case 'GAINED_FOCUS':
      return merge(stage, {ui: {activeSegmentId: action.segmentId}});
    default:
      return state
  }
}
