export const REQUEST_SEGMENT_DATA = 'REQUEST_SEGMENT_DATA';
export const RECEIVE_SEGMENT_DATA = 'RECEIVE_SEGMENT_DATA';
export const FAIL_SEGMENT_DATA = 'FAIL_SEGMENT_DATA';


export const fetchSegmentData = (filename, ) => (dispatch, getState) => {
    dispatch(requestSegmentData(filename, ));

    return fetch(`/api/segments/${filename}`, {mode: 'cors'})
        .then(res => res.json())
        .then(data => {
            dispatch(receiveSegmentData(filename, data));
        }).catch( (e) => {console.log(e); dispatch(failSegmentData(filename))});
}

const requestSegmentData = (filename, ) => {
    return {
        type: REQUEST_SEGMENT_DATA,
        filename
    }
}

const receiveSegmentData = (filename, data) => {
    return {
        type: RECEIVE_SEGMENT_DATA,
        filename,
        data
    }
}

const failSegmentData = (filename, ) => {
    return {
        type: FAIL_SEGMENT_DATA,
        filename
    }
}