# VDom生命流程

## VDom产生
Virtual DOM即 虚拟DOM 意思。其作用是 用JS对象去描述 一个DOM对象。   
因为一个真实的DOM拥有大量属性，所以操作真实DOM成本较高。   
使用VDom，对比操作前后dom描述 ，进行最小成本操作，提升性能。

## 流程
初始化：创建新VDom对象 > 生成真实DOM > 插入Document里。   
修改：创建新VDom对象 > 对比新旧Dom差异 > 进行最小成本修改。   

### 创建新VDom对象
我们知道Vue是使用，render函数里的createElement（函数）参数生成VDom。

```
// core/instance/render.js
...
...
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render, _parentVnode } = vm.$options

    ...
    ...
    try {
	   ...
	   ...
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      ...
      ...
    } finally {
      currentRenderingInstance = null
    }
    ...
    ...
    return vnode
  }
```
看到render里的createElement参数其实就是vm.$createElement

```
// core/instance/render.js
import { createElement } from '../vdom/create-element'
...
...
export function initRender (vm: Component) {
  ...
  ...
  // 编译器处理后的render函数上使用
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // 用户的render函数上使用
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
  ...
  ...
}

// core/vdom/create-element.js
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}
```
因为用户使用的createElement方法，该函数第二参数是选填，   
所以做了参数序列化，增强开发体验     
VDom实际使用_createElement方法构建。

```
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  // 检验参数 data是响应式 或者 没有tag 返回空VNode
  if (isDef(data) && isDef((data: any).__ob__)) {
    ...
    ...
    return createEmptyVNode()
  }
  ...
  ...

  // 如果是函数式组件，第一个节点默认为scopedSlots
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  // 实例VNode
  let vnode, ns
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }
      // 实例一个VNode
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      // 组件的VNode
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}
```
整个方法的逻辑是   
1. 验证参数，如果不合格着返回空VNode。   
2. 处理函数式组件作用域。   
3. 根据render版本，选择将子项打平方法。   
4. 生成并返回VNode。  

#### 生成真实DOM
生成完VNode后，Vue会通过Patch生成真实的Dom，更新到文档里。

```
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    ...
    ...
    if (!prevVnode) {
	   // 首次渲染dom
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    ...
    ...
  }
``` 

因为第一次没有prevVnode，所以会走首次渲染的逻辑。
我们再看下patch方法参数。

```
return function patch (oldVnode, vnode, hydrating, removeOnly) 
```
oldVnode = 真实dom   
vnode = 虚拟dom   
hydrating = removeOnly = false

```
return function patch (oldVnode, vnode, hydrating, removeOnly) {
    ...
    ...
    if (isUndef(oldVnode)) {
      ...
      ...
    } else {
      //是否是真实dom
      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        if (isRealElement) {
          ...
          ...
          // 创建空Vnode
          oldVnode = emptyNodeAt(oldVnode)
        }

        ...
        ...
        // 创建真实dom
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )

        ...
        ...
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
}
```