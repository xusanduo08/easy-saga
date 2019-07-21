import * as is from './utils/is';
import noop from './utils/noop';
import deferred from './utils/deferred';
import * as taskStatus from './utils/taskStatus';

function proc(env, iterator, mainCb, name){
  let mainTask = {status: taskStatus.RUNNING, name};
  let def = deferred();
  let task = newTask(def, mainTask, mainCb);

  next();
  return task;
  
  function next(arg, isErr){
    try{
      let result;
      if(isErr){
        result = iterator.throw(arg)
      } else if (arg === 'cancel_task'){
        mainTask.status = taskStatus.CANCELLED;
        next.cancel();
        // 取消任务时，会调用iterator.return方法，这使得代码会自动进入finally区块（如果有的话）
        result = is.func(iterator.return) ? iterator.return('cancel_task') : {done: true};
      } else if(isEND(arg)){
        result = {done: true}
      } else{
        result =  iterator.next(arg);
      }

      if(!result.done){
        digestEffect(result.value, next);
      } else {
        mainTask.cont(result.value);
      }
    } catch(e){
      mainTask.status = taskStatus.ABORTED;
      mainTask.cont(e, true); 
    }

  }

  function runEffect(effect, currCb){
    currCb.cancel = noop;
    if(is.promise(effect)){
      effect.then(currCb, (error) => {
        currCb(error, true)
      })
    } else if(is.iterator(effect)){
      proc(env, effect, currCb)
    } else if(effect && effect.type) {
      let effectRunner = effectRunnerMap[effect.type];
      effectRunner(effect.payload, currCb);
    } else {
      currCb(effect);
    }
  }

  function digestEffect(effect, cb){
    let settled = false;
    let currCb = (arg, isErr) =>{
      if(settled){
        return
      }
      cb.cancel = noop;
      cb(arg, isErr)
    }
    currCb.cancel = noop;
    cb.cancel = () => {
      if(settled){
        return
      }
      settled = true;
      currCb.cancel();
      currCb.cancel = noop;
    }
    runEffect(effect, currCb);
  }
}

export default proc;