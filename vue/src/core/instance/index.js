import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) //创建init方法，在new一个实例是调用
stateMixin(Vue) //创建model层相关属性，$data、$props、$watch、$delete、$set
eventsMixin(Vue) //创建事件通信相关属性，$on、$emit、$off、$once
lifecycleMixin(Vue) //创建声明周期相关属性，_update、$forceUpdate、$destroy
renderMixin(Vue) //创建渲染相关属性，$nextTick、_render

export default Vue
