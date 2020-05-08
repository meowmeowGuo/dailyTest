原文：[https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
# 前言
事实上，如果你更喜欢视频学习，[Philip Roberts](https://twitter.com/philip_roberts)有一个关于[event loop](https://www.youtube.com/watch?v=8aGhZQkoFbQ) 的很棒的演讲--尽管没有涉及微任务，但其他部分的介绍还是很值得学习的。好了，继续我们的话题。

来看一个JavaScript的小片段
```
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(function() {
  console.log('promise1');
}).then(function() {
  console.log('promise2');
});

console.log('script end');
```
上述代码中，日志将以什么样的顺序出现呢？
# 1. 试一试！
`可以将以上代码复制到浏览器的控制台看一下输出结果.`
正确的顺序是：`script start`,`script end`,`promise1`,`promise2`,`setTimeout`。
`文章中说不同浏览器的表现不一样，文章写于2015年，本机测试火狐和safari浏览器里的测试结果均与chrome一致。因此不再翻译这一部分`。

# 2. 为什么会这样呢？
 为了理解这个，你需要知道事件循环是怎么处理宏任务和微任务的。第一次遇到你可能会觉得很头大。深呼吸，我们继续...

每一个‘线程’都有一个自己的事件循环来保证其独立运行，web worker也是一样的，而所有的同源窗口拥有同一个 event loop 以便他们可以同步通讯。事件循环不断地处理任务队列中的任务。一个 event loop  可以有多个任务源，而这些任务源保证了来源于它的任务的执行顺序（就像 IndexedDB那样定义了自己的规范），但是浏览器在每轮循环的时候可以选择执行哪个任务源。这使浏览器可以优先处对性能敏感的任务，比如用户输入。

## 2.1 宏任务（Tasks）
任务有序执行使得便浏览器可以从内部访问 Javascript/DOM 并确保这些操作有序发生（其实这句话我不是很清楚该怎么翻译原文是：Tasks are scheduled so the browser can get from its internals into JavaScript/DOM land and ensures these actions happen sequentially.）。在两个任务的间隙，浏览器可能会进行更新渲染。鼠标点击触发事件回调需要执行一个宏任务，就像解析HTML一样，在上述例子的代码中`setTimeout`也是。

`setTimeout` 会在一段指定时间后执行，然后为它的回调函数创建一个新的宏任务。这就是为什么`setTimeout`会在`script end `之后输出，因为输出`script end`是第一个任务的内容，而`setTimeout`是在另一个任务中输出的。

## 2.2 微任务（microTask）
微任务通常是当前脚本执行完后要立即执行的内容，比如对一批操作做出响应，或者做一些异步处理。在每一个宏任务的最后，只要执行栈中没有需要执行的 Javascript ，就会在回调结束后处理微任务队列。在这一阶段（我：一个宏任务结束处理微任务阶段）产生的微任务都会被加入到微任务队列末尾，并且会在这一阶段处理（不需要等到下次宏任务结束）。微任务有包括`MutationObserver`的回调，以及开篇例子中的`promise`的回调。

一旦`promise`有了处理结果（resolve，reject），或者已经有了处理结果，就会为它对应的回调函数创建一个微任务（resolve->.then, reject->.catch）。这样可以确保`promise`是异步的，尽管他已经拿到了处理结果。因此在`promise`有结果后，调用`.then(yey,nay)`会立即创建一个微任务。这就是为什么`promise1`和`promise2`会在`script end `之后输出，因为在微任务处理之前必须要先处理完当前的脚本。`promise1`和`promise2`会在`setTimeout`之前输出是因为微任务会在下一个任务之前处理。

# 3. 如何辨别宏任务和微任务呢？
测试是一种方案。参考`promise`&`setTimeout`观察日志的输出，但是你要保证浏览器的实现是正确的。

稳妥的方案是查阅[**spec**](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps)。

# 4. 测试题
下面是html结构：
```
<div class="outer">
  <div class="inner"></div>
</div>
```
引入下面js文件，如果点击`div.inner`将会输出什么？
```
// Let's get hold of those elements
var outer = document.querySelector('.outer');
var inner = document.querySelector('.inner');

// Let's listen for attribute changes on the
// outer element
new MutationObserver(function() {
  console.log('mutate');
}).observe(outer, {
  attributes: true
});

// Here's a click listener…
function onClick() {
  console.log('click');

  setTimeout(function() {
    console.log('timeout');
  }, 0);

  Promise.resolve().then(function() {
    console.log('promise');
  });

  outer.setAttribute('data-random', Math.random());
}

// …which we'll attach to both elements
inner.addEventListener('click', onClick);
outer.addEventListener('click', onClick);
```
在看答案之前先试一试，提示：日志可以被打印多次
# 5. 答案
本机浏览器Chrome，Safari，火狐输出如下
```
click
promise
mutate
click
promise
mutate
timeout
timeout
```
分发`click`事件是一个宏任务，`MutationObserver`和`promise`的回调是微任务队列中的，`setTimeout`是一个宏任务。

我才知道微任务是在回调之后进行处理的（只要执行栈中没有其他的Javascript），之前我认为他就是宏任务结束后处理的。这个规则来源于`HTML spec`关于调用一个[回调函数的说明](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint)：
![](https://upload-images.jianshu.io/upload_images/10053029-3685457164112f61.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
微任务检查点会检查整个微任务队列，除非我们已经在处理微任务队列，同样的，[ECMAScript](https://www.ecma-international.org/ecma-262/6.0/#sec-jobs-and-job-queues)里这样说：
![](https://upload-images.jianshu.io/upload_images/10053029-e8a699a6fa796b03.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

`浏览器差异的问题不翻译`
# 6. 测试题升级
依然使用第`4`部分中的例子，如过我们执行下面的内容会发生什么？
```
inner.click();
```
这次会像之前一样进行事件分发处理，但这次用的是脚本而不是真正的交互。
# 7. 升级题目答案
```
click
click
promise
mutate
promise
timeout
timeout
```
# 8. 为什么两个结果会有差异？
当每个监听回调被调用后
![](https://upload-images.jianshu.io/upload_images/10053029-459fc3351cead5a0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
先前的结果中，微任务在两次监听回调之间，但是`.click()`导致事件分发是同步进行的，因此`.click()`的调用在两个监听回调之间依然在执行栈中。上述规则保证微任务不会中断Javascript的执行。这意味着，我们不是在两个监听回调之间处理微任务而是处理完两个监听回调之后处理微任务。

`IndexedDB相关不懂，不翻译`

# 9. 总结
* 宏任务按顺序执行，浏览器可能会在两个任务间隙进渲染更新
* 微任务按顺序执行，并且：
    1. 在每一个回调之后，只要执行栈中没有其他的js
    2. 在每一个任务结尾
