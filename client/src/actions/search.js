import { stat } from "mz/fs";

export const FETCH_SUGGESTIONS = 'FETCH_SUGGESTIONS';
export const RECEIVE_SUGGESTIONS = 'RECEIVE_SUGGESTIONS'

export const makeSearchKey = (...args) => {
    return args.join('_');
}

export const fetchSuggestions = (string, root_lang, target_lang, exclude_uid) => (dispatch, getState) => {
    let state = getState(),
        key = makeSearchKey(string, root_lang, target_lang);
    
    if (key in state.search.suggestions) {
        return
    }
    
    dispatch({
        type: FETCH_SUGGESTIONS,
        key: key
    });

    return fetch(`/api/tm/?string=${string}&root_lang=${root_lang}&target_lang=${target_lang}&exclude_uid=${exclude_uid}`, {mode: 'cors'})
        .then(res => res.json())
        .then(data => {
            dispatch(receiveSuggestions(key, data));
        }).catch( (e) => {console.log(e)});
}

export const receiveSuggestions = (key, data) => {
    return {
        type: RECEIVE_SUGGESTIONS,
        key: key,
        data
    }
}

