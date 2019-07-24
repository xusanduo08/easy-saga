#### 写一个redux-saga-4：effect和effectRunner

effect表示一个副作用，effectRunner用来执行effect。

effect一般结构如下：

```
{
  payload: {
    fn,
    context,
    channel,
    //...
  },
  type: effectType
}
```

`payload`中装载着需要传给effectRunner，用来执行effect的一些数据。

代码会根据`type`属性找到对应的effectRunner，接收`payload`，然后执行。

以`take()`和`runTakeEffect()`为例：

```javascript
// tak(action) 暂停iterator，等待指定action
// take(channel) 暂停iterator，等待指定channel中所包含的action
export function take(patternOrChannel = '*') {
  if (is.pattern(patternOrChannel)) {
    return { payload: { pattern: patternOrChannel }, type: TAKE }
  }
  if (is.channel(patternOrChannel)) {
    return { payload: { channel: patternOrChannel }, type: TAKE };
  }

}


function runTakeEffect(env, { channel = env.channel, pattern }, cb, {parentTask}) {
  try{
    channel.take(cb, matcher(pattern), TAKE);
  } catch(e){
    cb(e, true);
  }
}
```



感觉没啥要写的，saga基本的功能目前已经具备(call, fork, take, put, select, cancel, join, all, race)。总结下代码吧：

[https://github.com/xusanduo08/easy-saga/tree/master/%E5%86%99%E4%B8%80%E4%B8%AAredux-saga-4](https://github.com/xusanduo08/easy-saga/tree/master/写一个redux-saga-4)

控制台可直接`npm run test`运行测试用例，以上提到的功能的测试用例均能跑通。