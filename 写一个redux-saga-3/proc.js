import * as is from './utils/is';
import noop from './utils/noop';
import * as taskStatus from './utils/taskStatus';

function proc(env, iterator, mainCb, name){
  let mainTask = {status: taskStatus.RUNNING, name};
  
  let def = {};
  let promise = new Promise((resolve, reject) => { // 为什么不直接用deferred()?我也想不明白。。。。。
    def.resolve = resolve;
    def.reject = reject;
  }).catch(e => console.log(e))
  def.promise = promise;

  let task = newTask(def, name, mainTask, mainCb);

  mainTask.cancel = () => {
    if(mainTask.status === taskStatus.RUNNING){
      mainTask.status = taskStatus.CANCELLED;
      next('cancel_task');
    }
  }
  mainCb.cancl = task.cancel; // 如果当前task是个附属task，则需要给mainCb设置cancel方法，便于父task的取消动作
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
    //分情况处理effect：Promise, iterator, effect, 普通方法/变量
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
      settled = true;
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