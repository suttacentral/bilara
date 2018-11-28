export const UPDATE_SEGMENT = 'UPDATE_SEGMENT';

export const updateSegment = (segmentId, dataType, value) => {
  return {
    type: UPDATE_SEGMENT,
    segmentId,
    dataType,
    value
  }
}