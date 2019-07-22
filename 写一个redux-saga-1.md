#### 写一个redux-saga-1: Saga基本结构

saga使用方法：

将异步操作（副作用）放在`yield`后面，操作完成后，saga会自动继续执行接下来的代码。

```javascript
let sagaMiddleware = createSagaMiddleware();
createStore(reducers, {}, applyMiddleware(sagaMiddleware));

function* rootSaga(){
  yield take('action-A');
  yield call(fetchData);
  //...
}
sagaMiddleware.run(rootSaga)
```

所有一切的入口就在这一句：

```javascript
sagaMiddleware.run(rootSaga)
```

一句话：`run()`方法启动saga



saga结构大致有以下几个部分：

* sagaMiddlewareFactory：工厂方法，用来创建sagaMiddleware中间件

* run：程序入口，将action传递到下一个中间件，同时启动rootSaga，并将rootSaga执行后返回的iterator传递给proc继续执行

* proc：主要部分，用来执行Generator运行后产生的Iterator，负责触发iterator.next()，并根据每次执行返回的结果选择对应的runner来处理。

* task：proc方法运行后的返回值，代表一次saga任务。

* effects（位于io.js文件中）：定义用来产生effect的方法，例如我们用的`take`，`put`等方法，这些方法返回的结果都是一个effect。一个effect的结构如下：

  ```javascript
  {
  	payload:{
      fn, context
      // ... 需要传给effectRunner的参数
    },
  	type: effectType // TAKE, PUT, CALL等
  
  ```

  

* effectRunner（位于effectRunnerMap.js文件中）：这部分定义了用来执行每种类型effect的方法，例如，`take()`操作产生的effect需要`takeEffectRunner()`方法来执行

* channel（位于channel.js文件中）：通道定义文件，通道可用于saga之间的通信和缓存消息

* forkQueue（位于forkQueue.js文件中）：定义了管理fork task的队列，`fork()`方法会创建另一个task，产生的task会由forkQueue来管理

* util（位于utils.js文件中）：定义了一些工具方法，如`resolvePromise()`、`remove()`等。



下面写一下saga的工厂函数：`sagaMiddlewareFactory()`，用来创建saga中间件。

```javascript

function sagaMiddlewareFactory(){
  function sagaMiddleware({getState, dispatch}){
    return next => action => {
      next(action);
      /**TODO action经过我们的中间件*/
    }
  }
    
  sagaMiddleware.run = (saga) => {
    // 启动saga
    // 将iterator传入proc方法继续执行
  }
    
  return sagaMiddleware
}
```

上面是`sagaMiddlewareFactory()`的大概样子。

saga中间件在获取到action后，需要决定是否要采取相应的动作，因此事先我们需要将action以及需要采取的动作注册到saga中间件某处-----如上所说我们将action以及需要采取的动作注册到channel中。（个人理解：想象一下，有个管道，action和对应的动作像“滤网”一样存在于管道中。当外界的action从管道中流过时，那些有相同action的滤网就会被击中，对应的操作就会被触发，同时管道中action被击中一次后就会被移除管道）

来定义一个channel。channel要有一个可以注册action和动作的方法，还要有一个能将接收到的action推入管道的方法。

```javascript
function stdChannel(){
  let takers = []; // 用来放置action和cb
  function put(action){ // 将action推入管道
  let currTakers = takers.concat([]); // 防止遍历的时候takers发生变化
  let desTakes = []; // 用来保存回调已经被执行的taker的索引，遍历结束后用来过滤takers
  currTakers.forEach((take, index) => {
    if(take.action.type === action.type){
      desTakes.push(index);
      cb(action);
    }
  })
  takers = takers.filter((item, index) => !(desTakes.indexOf(index) >=0));
  
  function take(action, cb){ // 注册action和对应的操作cb
    takers.push({action, cb});
  }
  
  return {
    put,
    take
  }
}
```

来将管道应用到`sagaMiddlewareFactory()`中：

```javascript
function sagaMiddlewareFactory(){
  let channel = stdChannel();
  function sagaMiddleware(){ 
    return next => action => {
      next(action);
      channel.put(action); // 将action推入管道
    }
  }
  sagaMiddleware.run = (saga) => {
    let iterator = saga(); // 启动saga
    return proc(iterator); // proc处理iterator，下节会写
  }
  return sagaMiddleware;
}
```



本节代码地址：[https://github.com/xusanduo08/easy-saga/tree/master/%E5%86%99%E4%B8%80%E4%B8%AAredux-saga-1](https://github.com/xusanduo08/easy-saga/tree/master/写一个redux-saga-1)



