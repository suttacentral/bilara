export const REQUEST_SEGMENT_DATA = 'REQUEST_SEGMENT_DATA';
export const RECEIVE_SEGMENT_DATA = 'RECEIVE_SEGMENT_DATA';
export const FAIL_SEGMENT_DATA = 'FAIL_SEGMENT_DATA';

export const fetchSegmentData = () => (dispatch, getState) => {
    const state = getState();
    const uid = state.app.page_lefts[0] || 'dn1',
          to_lang = state.app.page_lefts[1] || 'en';

    dispatch(requestSegmentData(uid, to_lang));
    
    return fetch(`http://localhost:5000/api/segments/?uid=${uid}&to_lang=${to_lang}`, {mode: 'cors'})
        .then(res => res.json())
        .then(data => {
            console.log('Received Data', JSON.stringify(data));
            dispatch(receiveSegmentData(uid, to_lang, data));
        }).catch( (e) => {console.log(e); dispatch(failSegmentData(uid, to_lang))});
}

const requestSegmentData = (uid, to_lang) => {
    return {
        type: REQUEST_SEGMENT_DATA,
        uid,
        to_lang
    }
}

const receiveSegmentData = (uid, to_lang, data) => {
    return {
        type: RECEIVE_SEGMENT_DATA,
        uid,
        to_lang,
        data
    }
}

const failSegmentData = (uid, to_lang) => {
    return {
        type: FAIL_SEGMENT_DATA,
        uid,
        to_lang
    }
}