#### 写一个redux-saga-2：proc
这节来写proc。
iterator需要手动的去调用next()方法才会往下执行。同时，next()是可以传入参数的，传入的参数会被当作是上一个yield表达式的结果。例如：

```javascript
function* gen{
	let result =  yield 3;
  console.log(result);
}

let it = gen();
it.next(); // {value: 3, done: false}
it.next(4); // 4 {value: undefined, done: true}
```



为了满足Iterator的运行，采用递归来消耗Iterator。proc中`next()`方法会不断调用以来消耗iterator。在generator中，`yield`语句后面可以跟普通方法、Promise、或者另一个generator方法。我们需要根据不同的返回类型来选择对应的effectRunner。

如果`yield`后面跟的依然是一个generator，这种情况比较复杂，

runner去执行对应effect之后，需要将执行结果返回，并继续执行，所以effectRunner中要传入一个cb（callback），来告诉effectRunner执行完毕后该干啥。正常情况这个cb就是`next()`方法。

此外，effect 是可取消的，每个effectRunner需要给传入的cb设置一个cancel方法，告诉主任务如何取消当前的effect。

```javascript
import effectRunner from './effectRunner.js'；


function proc(iterator){
	next();
	
	function next(arg){
		let result = iterator.next(arg);
    if(!result.done){
      // TODO 根据result.value进行相应的操作
    }
	}
  
  function digestEffect(effect, cb){
    
  }
}
```