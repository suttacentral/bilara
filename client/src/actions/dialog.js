export const SET_PUBLISH_DATA = 'SET_PUBLISH_DATA';
export const RESET_DIALOG_DATA = 'RESET_DIALOG_DATA';
export const CLOSE_DIALOG = 'CLOSE_DIALOG';

export const setPublishData = (data, reset) => (dispatch, getState) => {
  if (reset || getState().dialog.publishData.path != data.path) {
    dispatch({
      type: RESET_DIALOG_DATA
    })
  }
  
  dispatch({
    type: SET_PUBLISH_DATA,
    data: data
  })
}

export const closeDialog = () => dispatch => {
  dispatch({
    type: CLOSE_DIALOG
  })
}