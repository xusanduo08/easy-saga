#### 写一个redux-saga-3：task

这一节来写一下task。

上一节我们说过`proc()`方法在执行时会产生一个task，这个task中保存着当前任务的mainTask，以及可能产生的子任务。

task的属性树形结构：

![task的结构](./img/task结构.png)

