#### 写一个redux-saga-3：task

这一节来写一下task。

proc在运行一开始就会创建task，task是当前主任务mainTask以及分支任务的集合。task承担着当前任务的终止、取消、完成以及管理子任务等角色。

task的树形结构：

![task的结构](./img/task结构.png)

关于task，有以下几个特点：
- task是可取消的（调用task.cancel()方法）
- 父任务取消时会带着未完成的子任务一起取消
- 当task运行出错时，task会aborted，其父任务也会aborted，兄弟任务则会被取消
- 一个task在结束之前，会等待其下所有分叉任务结束
- 来自子任务的错误会冒泡到父任务中
- task运行结束后，其运行结果会通过task自身携带的promise的resolve方法传递出去

要实现的功能：
* task可取消。取消一个task，会取消以这个task会根的task树
* task结束后，会自动将结果传递到父任务回调中，父任务继续执行
* 当前task出错，其下所有子task都会被取消，父任务会aborted，兄弟任务会被取消，并且错误会一直冒泡到最上面的任务

```javascript
/**
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
```



本节代码地址：[https://github.com/xusanduo08/easy-saga/tree/master/%E5%86%99%E4%B8%80%E4%B8%AAredux-saga-3](https://github.com/xusanduo08/easy-saga/tree/master/写一个redux-saga-3)