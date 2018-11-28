export const GET_BROWSE_DATA = "GET_BROWSE_DATA";

export const getBrowseData = () => (dispatch) => {
  return fetch('http://localhost:5000/api/nav/')
  .then(res => res.json())
  .then(data => {
      dispatch( {
        type: GET_BROWSE_DATA,
        data: data
      } );
  }).catch( (e) => {console.log(e);})
}