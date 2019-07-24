import * as taskStatus from './utils/taskStatus';
import noop from './utils/noop';
import remove from './utils/remove';

/**
 * 
 * @param {*} def 延迟对象，包装了一个promise
 * @param {*} mainTask 当前任务对应的主任务
 * @param {*} name saga方法名
 * @param {*} cont task完成时，需要执行的回调。如果该任务是个fork task，那么其cont方法会被父task重写
 */
export default function newTask(def, name, mainTask, cont){
  let queue = forkQueue(mainTask, end);
  let status = taskStatus.RUNNING;
  let taskResult;

  function end(res, isErr){ // 任务出错，取消，完成都会调用end，来将信息上传到上一层任务对象（通过task.cont方法）
    if(!isErr){
      if(res === 'cancel_task'){
        status = taskStatus.CANCELLED
      } else if(status !== taskStatus.CANCELLED){
        status = taskStatus.DONE
      }
      taskResult = res;
      def.resolve(res);
    } else {
      status = taskStatus.ABORTED;
      def.reject(res);
    }
    
    task.joiners.forEach(joiner => { // 执行等待该任务的回调
      joiner.cb(res)
    })
    task.joiners = null;
    task.cont(res, isErr);
  }

  /**
   * 当一个任务被取消时，已这个任务为根的task树上的任务都会被取消，任务的joiner也会被取消
   */
  function cancel(){
    if(status === taskStatus.RUNNING){
      // 调用取消方法后，任务中的effec会进入到finally区块中执行（如果有的话）
      status = taskStatus.CANCELLED;
      queue.cancelAll();
      end('cancel_task', false);
    }
  }

  const task = {
    name,
    cont,
    status,
    isRunning: () => status === taskStatus.RUNNING,
    isCancelled: () => status === taskStatus.CANCELLED || (status === taskStatus.RUNNING && mainTask.status === taskStatus.CANCELLED),
    isAborted: () => status === taskStatus.ABORTED,
    result: () => taskResult,
    cancel,
    queue,
    end,
    joiners: [],
    toPromise: () => def.promise
  }
  return task
}

/**
 * 生成一个任务队列，在添加任务时自动给任务赋值cont方法
 * 任务结束或者出错时会调用自身的cont方法通知父任务
 * @param {*} mainTask 主任务
 * @param {*} end task结束方法
 */
function forkQueue(mainTask, end){
  let queue = [];
  let result;
  let completed = false;

  addTask(mainTask);
  function addTask(task){
    queue.push(task);
    task.cont = (res, isErr) => {
      if(completed){
        return
      }
      remove(queue, task) // 该任务已执行过，将该任务从任务队列中移除
      if(isErr){
        cancelAll(); // 任务出错，取消队列中的其他任务
        end(res, isErr); // 错误信息冒泡
      } else {
        if(task === mainTask){
          result = res
        }
        if(!queue.length){ // 任务队列为空时，才会触发task的end方法
          completed = true;
          end(result, false);
        }
      }
    }
  }

  function cancelAll(){
    if(completed){
      return
    }
    completed = true;
    queue.forEach(task => {
      task.cont = noop;
      task.cancel();
    })
    queue = []
  }
  return {
    addTask,
    cancelAll
  }
}