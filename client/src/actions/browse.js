export const GET_BROWSE_DATA = "GET_BROWSE_DATA";
export const UPDATE_PATH = "UPDATE_PATH";

export const getBrowseData = () => (dispatch, getState) => {
  const user = getState().app.user;
  return fetch('/api/nav/', {
    headers: {
      "X-Bilara-Auth-Token": user.authToken,
      "X-Bilara-Username": user.username
  }}
).then(res => res.json())
  .then(data => {
      dispatch( {
        type: GET_BROWSE_DATA,
        data: data
      } );
  }).catch( (e) => {console.log(e);})
}

export const updatePath = args => (dispatch) => {
  dispatch({
    type: UPDATE_PATH,
    path: args.path.replaceAll('/', '.').replace(/^translation/, 'tree'),
    value: args.value
  });
}