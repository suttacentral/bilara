export const GET_BROWSE_DATA = "GET_BROWSE_DATA";
import { getApiUrl } from './app.js';

export const getBrowseData = () => (dispatch) => {
  return fetch(getApiUrl() + '/nav/')
  .then(res => res.json())
  .then(data => {
      dispatch( {
        type: GET_BROWSE_DATA,
        data: data
      } );
  }).catch( (e) => {console.log(e);})
}