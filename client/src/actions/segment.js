export const UPDATE_SEGMENT = 'UPDATE_SEGMENT';
export const FOCUS_SEGMENT = 'FOCUS_SEGMENT';
export const QUEUE_SEGMENT = 'QUEUE_SEGMENT';
export const UNQUEUE_SEGMENT = 'UNQUEUE_SEGMENT';


import { pushToServer } from './queue.js';

export const updateSegment = (filename, segmentId, dataType, value) => (dispatch, getState) => {
  const timestamp = Date.now();
  dispatch({
    type: QUEUE_SEGMENT,
    key: [filename, segmentId, timestamp].join('_'),
    data: {
      timestamp: timestamp,
      filename,
      segmentId,
      value
    }
  });

  dispatch(pushToServer())

  dispatch({
    type: UPDATE_SEGMENT,
    segmentId,
    dataType,
    value
  })
}

export const focusSegment = segmentId => dispatch => {
  dispatch({
    type: FOCUS_SEGMENT,
    segmentId
  })
}