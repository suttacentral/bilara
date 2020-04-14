import {
    REQUEST_SEGMENT_DATA, RECEIVE_SEGMENT_DATA, FAIL_SEGMENT_DATA,
} from '../actions/segment-data.js';
import {
    UPDATE_SEGMENT, FOCUS_SEGMENT
} from '../actions/segment.js';
import {
    RESOLVE_PUSH
} from '../actions/queue.js';

const deleteProperty = ({[key]: _, ...newObj}, key) => newObj;

const getSavedQueue = () => {
  try {
    return JSON.parse(localStorage.getItem('uploadQueue'));
  } catch (e) {console.log('Could not parse saved uploadQueue', e)}

  return undefined
}

const defaultState = {
  uploadQueue: getSavedQueue() || {}, 
  pushState: {}
}

export const segmentData = (state = defaultState, action) => {
    const filename = action.filename;
    switch (action.type) {
        case REQUEST_SEGMENT_DATA:
            return {
                ...state,
                data: null,
                filename: filename,
                failure: false,
                isFetching: true
            }
        case RECEIVE_SEGMENT_DATA:
            return {
                ...state,
                data: action.data,
                filename: filename,
                failure: false,
                isFetching: false
            }
        case FAIL_SEGMENT_DATA:
            return {
                ...state,
                filename: filename,
                failure: true,
                isFetching: false
            }
        case FOCUS_SEGMENT:
            return {
                ...state,
                activeSegmentId: action.segmentId
            }
        case UPDATE_SEGMENT:
            return {
                ...state,
                data: {
                    ...state.data,
                    [action.dataType]: {
                        ...state.data[action.dataType],
                        [action.segmentId]: action.value
                    }
                }
            }
        case RESOLVE_PUSH:
            return {
                ...state,
                pushState: Object.keys(action.segmentData).reduce((pushState, key) => {
                    if (action.segmentData[key] == 'SUCCESS') {
                        let segment = state.uploadQueue[key],
                            dataType = segment.filepath.split('_')[1].split('-')[0];
                        pushState[segment.segmentId] = 'finalized';
                    }
                    return pushState
                }, {...state.pushState}),
                uploadQueue: Object.keys(action.segmentData).reduce((uploadQueue, key) => {
                    let segment = state.uploadQueue[key];
                    if (action.segmentData[key] == 'SUCCESS') {
                        // This no longer needs to be in the queue
                        return uploadQueue
                    }
                    uploadQueue[key] = segment;
                    return uploadQueue
                }, {})
            }
        default:
            return state;
    }
}
