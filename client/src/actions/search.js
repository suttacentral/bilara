export const FETCH_SUGGESTIONS = 'FETCH_SUGGESTIONS';
export const RECEIVE_SUGGESTIONS = 'RECEIVE_SUGGESTIONS'

export const makeSearchKey = (...args) => {
    return args.join('_');
}

export const fetchSuggestions = (rootLang, targetLang, rootString, excludeUid) => (dispatch, getState) => {
    let state = getState(),
        key = makeSearchKey(rootLang, targetLang, rootString);
    
    if (key in state.search.suggestions) {
        return
    }
    
    dispatch({
        type: FETCH_SUGGESTIONS,
        key: key
    });

    return fetch(`/api/tm/?string=${rootString}&root_lang=${rootLang}&translation_lang=${targetLang}&exclude_uid=${excludeUid}`, {mode: 'cors'})
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

