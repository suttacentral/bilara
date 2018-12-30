import {
    REQUEST_SEGMENT_DATA, RECEIVE_SEGMENT_DATA, FAIL_SEGMENT_DATA,
} from '../actions/segment-data.js';
import {
    UPDATE_SEGMENT, QUEUE_SEGMENT
} from '../actions/segment.js';
import {
    RESOLVE_PUSH
} from '../actions/queue.js';

const deleteProperty = ({[key]: _, ...newObj}, key) => newObj;

export const segmentData = (state = {uploadQueue: {}}, action) => {
    const uid = action.uid;
    switch (action.type) {
        case REQUEST_SEGMENT_DATA:
            return {
                ...state,
                data: null,
                uid: uid,
                failure: false,
                isFetching: true
            }
        case RECEIVE_SEGMENT_DATA:
            return {
                ...state,
                data: action.data,
                uid: uid,
                failure: false,
                isFetching: false
            }
        case FAIL_SEGMENT_DATA:
            return {
                ...state,
                uid: uid,
                failure: true,
                isFetching: false
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
        case QUEUE_SEGMENT:
            return {
                ...state,
                uploadQueue: {
                    ...state.uploadQueue, 
                    [action.key]: action.data
                }
            }
        case RESOLVE_PUSH:
            return {
                ...state,
                uploadQueue:  Object.keys(action.segmentData).reduce((obj, key) => {
                    if (action.segmentData[key] == 'SUCCESS') return obj
                    obj[key] = state.uploadQueue[key];
                    return obj
                }, {})
            }
        default:
            return state;
    }
}
