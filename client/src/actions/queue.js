export const PUSH_QUEUE_TO_SERVER = "PUSH_QUEUE";
export const RESOLVE_PUSH = "RESOLVE_PUSH";


function saveQueueState(getState) {
  let state = getState();
  let queue = state.segmentData.uploadQueue;
  localStorage.setItem('uploadQueue', JSON.stringify(queue));
}

export const pushToServer = () => (dispatch, getState) => {
    const user = getState().app.user;
        
    saveQueueState(getState);
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
    }).then( (res) => {
      return res.json()
    })
    .then( (data) => {
        dispatch({
            type: RESOLVE_PUSH,
            segmentData: data
        });
        saveQueueState(getState);
    }).catch( (e) => {
        console.log(e);
    })
}