export const PUSH_QUEUE_TO_SERVER = "PUSH_QUEUE";
export const RESOLVE_PUSH = "RESOLVE_PUSH";


export const pushToServer = () => (dispatch, getState) => {
    const user = getState().app.user;
        
    
    return fetch(`/api/segments/`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            "Content-Type": "application/json",
            "X-Bilara-Auth-Token": user.authToken,
            "X-Bilara-Username": user.username,
        },
        body: JSON.stringify(getState().segmentData.uploadQueue)
    }).then( (res) => res.json())
    .then( (data) => {
        dispatch({
            type: RESOLVE_PUSH,
            segmentData: data
        });
    }).catch( (e) => {
        console.log(e);
    })
}