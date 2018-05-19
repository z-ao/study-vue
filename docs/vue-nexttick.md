---
title: VUE NextTick解析
date: 2018-05-19 14:42:22
tags: vue
---

# VUE NextTick解析
## 方法作用
在下次 DOM 更新循环结束之后执行延迟回调
## 应用场景
MVVM框架是按数据驱动更新DOM,   
但DOM的更新是异步的,   
所以改方法使用在DOM更新后的逻辑.
## 思考
* 如何在下次 DOM 更新后执行
* 如果做到浏览器兼容

<!--more-->
## 源码
```
/**
 * Defer a task to execute it asynchronously.
 */
 /*
    延迟一个任务使其异步执行，在下一个tick时执行，一个立即执行函数，返回一个function
    这个函数的作用是在task或者microtask中推入一个timerFunc，在当前调用栈执行完以后以此执行直到执行到timerFunc
    目的是延迟到当前调用栈执行完以后执行
*/
export const nextTick = (function () {
  /*存放异步执行的回调*/
  const callbacks = []
  /*一个标记位，如果已经有timerFunc被推送到任务队列中去则不需要重复推送*/
  let pending = false
  /*一个函数指针，指向函数将被推送到任务队列中，等到主线程任务执行完时，任务队列中的timerFunc被调用*/
  let timerFunc

  /*下一个tick时的回调*/
  function nextTickHandler () {
    /*一个标记位，标记等待状态（即函数已经被推入任务队列或者主线程，已经在等待当前栈执行完毕去执行），这样就不需要在push多个回调到callbacks时将timerFunc多次推入任务队列或者主线程*/
    pending = false
    /*执行所有callback*/
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for (let i = 0; i < copies.length; i++) {
      copies[i]()
    }
  }

  // the nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  /* istanbul ignore if */

  /*
    这里解释一下，一共有Promise、MutationObserver以及setTimeout三种尝试得到timerFunc的方法
    优先使用Promise，在Promise不存在的情况下使用MutationObserver，这两个方法都会在microtask中执行，会比setTimeout更早执行，所以优先使用。
    如果上述两种方法都不支持的环境则会使用setTimeout，在task尾部推入这个函数，等待调用执行。
    参考：https://www.zhihu.com/question/55364497
  */
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    /*使用Promise*/
    var p = Promise.resolve()
    var logError = err => { console.error(err) }
    timerFunc = () => {
      p.then(nextTickHandler).catch(logError)
      // in problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      if (isIOS) setTimeout(noop)
    }
  } else if (typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    /*新建一个textNode的DOM对象，用MutationObserver绑定该DOM并指定回调函数，在DOM变化的时候则会触发回调,该回调会进入主线程（比任务队列优先执行），即textNode.data = String(counter)时便会触发回调*/
    var counter = 1
    var observer = new MutationObserver(nextTickHandler)
    var textNode = document.createTextNode(String(counter))
    observer.observe(textNode, {
      characterData: true
    })
    timerFunc = () => {
      counter = (counter + 1) % 2
      textNode.data = String(counter)
    }
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    /*使用setTimeout将回调推入任务队列尾部*/
    timerFunc = () => {
      setTimeout(nextTickHandler, 0)
    }
  }

  /*
    推送到队列中下一个tick时执行
    cb 回调函数
    ctx 上下文
  */
  return function queueNextTick (cb?: Function, ctx?: Object) {
    let _resolve
    /*cb存到callbacks中*/
    callbacks.push(() => {
      if (cb) {
        try {
          cb.call(ctx)
        } catch (e) {
          handleError(e, ctx, 'nextTick')
        }
      } else if (_resolve) {
        _resolve(ctx)
      }
    })
    if (!pending) {
      pending = true
      timerFunc()
    }
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise((resolve, reject) => {
        _resolve = resolve
      })
    }
  }
})()
```
1. 检测当前环境决定调用timerFunc的方式,(顺序Promise => MutationObserver => setTimeout)
2. 返回queueNextTick函数
3. 把cb放入callbacks数组中
4. 设置pending = true(保证只执行一次), 调用timerFunc

## 拓展
### MutationObserver
该方法能监听DOM树发生变化后,触发回调.
### 浏览器事件处理机制
js的事件周期分为task 和 microtask,   
当task执行完毕后(UI已经重新渲染),才执行microtask.

## 解答
因为Promise、MutationObserver、settimeout会在task完毕后执行,   
所以能在DOM更新后执行函数.   
Promise、MutationObserver会在microtask里执行,   
而settimeout会在当前task的下一个task里执行(会创建一个task),   
为了避免创建额外的task和保证浏览器的兼容,   
所以优先级是Promise => MutationObserver => setTimeout
## 参考资料
[https://github.com/answershuto/learnVue/blob/master/docs/Vue.js]('https://github.com/answershuto/learnVue/blob/master/docs/Vue.js%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0DOM%E7%AD%96%E7%95%A5%E5%8F%8AnextTick.MarkDown')