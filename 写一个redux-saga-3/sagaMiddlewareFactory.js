import stdChannel from './channel.js';
import proc from './proc';
import noop  from './utils/noop';

export default function sagaMiddlewareFactory(){
  let runSaga;
  function sagaMiddleware({dispatch, getState}){
    let channel = stdChannel();
    
    runSaga = (saga) => {
      let env = {
        dispatch, 
        getState
      }
      let iterator = saga();
      return proc(env,  iterator, noop, saga.name);
    }
    return next => action => {
      next(action);
      channel.put(action); // 将action推入管道
    }
  }

  sagaMiddleware.run = (saga) => {
    if(runSaga){
      return runSaga(saga);
    } else {
      throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
    }
    
  }
}