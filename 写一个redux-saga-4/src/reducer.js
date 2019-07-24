export default (state = {}, action) => {
  switch (action.type) {
    case 'START':
      return { ...state };
    case 'PAUSE':
      return { ...state };
    case 'ADD':
      return { ...state, count: ++state.count };
    case 'PUT_ACTION':
        return {text: action.payload};
    default:
      return state;
  }
}