export const REQUEST_SEGMENT_DATA = 'REQUEST_SEGMENT_DATA';
export const RECEIVE_SEGMENT_DATA = 'RECEIVE_SEGMENT_DATA';
export const FAIL_SEGMENT_DATA = 'FAIL_SEGMENT_DATA';

export const fetchSegmentData = (filename, root, tertiary ) => (dispatch, getState) => {
    dispatch(requestSegmentData(filename, ));

    let uploadQueue = JSON.parse(localStorage.getItem('uploadQueue') || '{}');

    const state = getState(),
          user = state.app.user;
    
          console.log('State', state);

    let url = new URL(`/api/segments/${filename}`, window.location.origin);
    if (root) {
        url.searchParams.set('root', root)
    }
    if (tertiary) {
        url.searchParams.set('tertiary', tertiary)
    }

    return fetch(url, {
        mode: 'cors',
        headers: {
            "X-Bilara-Auth-Token": user.authToken,
            "X-Bilara-Username": user.username
        }
    })
    .then(res => res.json())
    .then(data => {
        Object.values(uploadQueue).map((queuedSegment) => {
            const segmentId = queuedSegment.segmentId;
            if (data.segments[filename][segmentId]) {
                data.segments[filename][segmentId] = queuedSegment.value;
            }
        });
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
