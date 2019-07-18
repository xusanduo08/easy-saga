import stdChannel from './channel.js';
import proc from './proc';

export default function sagaMiddlewareFactory(){
  function sagaMiddleware(){
    let channel = stdChannel();
    return next => action => {
      next(action);
      channel.put(action); // 将action推入管道
    }
  }

  sagaMiddleware.run = (saga) => {
    let iterator = saga(); // 启动saga
    return proc(iterator);
  }
}