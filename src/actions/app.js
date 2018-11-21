export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';


export const navigate = (path) => (dispatch) => {
  const page = path == '/' ? 'view1': path.slice(1);

  dispatch(loadPage(page));
};


const loadPage = (page) => (dispatch) => {

}
