# vue权限管理思路
> 使用vue做前后端分离时, vue单页面的获取权限时,   
> 不会像larval、thinkphp获取权限那么方便,直接从数据库查询下权限,   
> 获取权限需要调取接口,并等待接口返回后才做下一步操作,   
> 每次渲染页面都调取权限的接口是不明智的,这会加长页面的渲染时间,   
> 但如果在获取权限数据后,保存在本地时,要考虑性能、安全、和生存有效期.

## 要点
因为**业务员在后台对不同的用户配置不同的权限**,这个需求发生的概率非常大.   
所以为了保证灵活性,不能在前端写个配置权限文件,不然每次更改权限都要修改配置文件,然后打包上传.   
这一操作应该把权限的配置放置数据库,业务员通过后台修改数据库数据,   
用户登录时从接口获取对应的权限配置.   

## 后台操作
虽然用户权限在前、中台体现,但是在后台赋予,所以做权限管理时,还要知道后台的相应流程.

***相应流程***

<image src="./images/permission1.png" style="width: 70%; margin: 0 auto">

简单来说就是用户是通过角色来赋予权限.

## 接口数据
从流程图看到,用户与角色和权限是递进关系,那么接口返回的是用户对应的角色?或是对应角色下的权限?   
因为权限是这流程里最底层的一步,所以返回对应角色下的权限比较灵活.

> 权限可以理解为是否能进行那个功能的操作,   
> 技术层面来讲是是否可以调取那个接口

```
//设想的数据格式
[
	'/api/a/select', 
	'/api/a/update', 
	'/api/a/delete',
	'/api/b/select', 
	'/api/b/update',
	'/api/c/select'
]
```
## 权限的体现
获取权限后,用户是否拥有权限的体现在

1. 是否能访问相应路由
2. 是否显示相应导航
3. 是否显示相应页面部分

## 获取权限
### 时机
前端是在什么时候获取权限?   
在用户登录、注册后?   
如果是,那么后台修改了权限,用户如果勾选自动登录的话,那么一直都不会重新获取权限.   
准确点来做,应该在**用户已登录状态时,但未获取权限**,才获取权限.   
而获取权限地方是在**路由进入前**.
### 存储
获取权限的时机条件1.用户已登录状态时, 2.未获取权限,   
所以未获取权限就体现在没有存储权限,   
且权限的配置会在路由的增加、菜单渲染、页面特定模块的渲染用到.   
那么是存储在缓存里？还是本地?   
存在缓存缺点是,如果数据量大,会影响到性能.   
存在本地缺点是,如果后台设置新的权限,刷新页面不会获取新的权限,而是从本地获取.  
其实可以分为两部份,有没获取**权限的标示存储在内存**中,**权限的数据存储在本地**.

``` 
//path filter/router.js
import router    from '@/router/index'
import dataStore from 'dataStore' //封装的数据管理类
...
...

let PermissionLock = false
router.beforeEach((from, to, next) => {
	if(isLogin && !PermissionLock) {
		getPermission().then(res => {
			PermissionLock = true
			dataStore.storage.set('permission', res);
		});
	}
})
```

## 路由权限
路由分为两种,普通路由和权限路由   
普通路由是没有登录状态能访问的,会在路由初始化使用,例如登录、404页面   
权限路由是需要有相应的权限才能访问的,会动态添加,例如面板页面   
路由的配置格式与vue-router一致,所以创建vue-router实例时不用额外处理.

```
//path router/router.js
const commonRoutes = [
	{
		path: '/404',	//404页面
		component: NotFound,
		name: 'NotFound'
	},
	{ 	path: '/403',	//403页面
		component: Forbidden,
		name: 'Forbidden'
	},
	{
		path: '/login/password', //密码登录
		name: 'passwordLogin',
		component: passwordLogin
	},
	{
		path: '/',
		redirect: { name: 'passwordLogin' }
	}
];

const permissionRoutes = [
	{
		path: '/a',
		component: a,
		redirect: { name: 'AIndex' },
		children: [
			{
				path: '/a/index',
				component: AIndex,
				name: 'AIndex',
				meta: {
					permission: ['/api/a/select'],
					nav: {
						title: 'a-详情'
					}
				}
			},
			{
				path: '/a/edit',
				component: AEdit,
				name: 'AEdit',
				meta: {
					permission: ['/api/a/update']
				}
			}
		]
	},
	{
		path: '/b',
		component: b,
		redirect: { name: 'BIndex' },
		children: [
			{
				path: '/b/index',
				component: BIndex,
				name: 'BIndex',
				meta: {
					permission: ['/api/b/select'],
					nav: {
						title: 'b-详情'
					}
				}
			},
			{
				path: '/b/edit',
				component: BEdit,
				name: 'AEdit',
				meta: {
					permission: ['/api/b/update']
				}
			}
		]
	},
	{
		path: '/c',
		component: CIndex,
		name: 'CIndex',
		meta: {
			permission: ['/api/c/select']
		}
	},
	{
		path: '*',
		redirect: { name: 'NotFound' }	//404页面
	}
};

export commonRoutes;
export permissionRoutes;

//path router/index.js
import Router from 'vue-router'

import * as ALL_ROUTE from './router'

const vueRouter = new Router({
    mode: 'history',
    routes: ALL_ROUTE.commonRoutes,
});

export default vueRouter
```

通过route的meta字段设置permission值,配置该路由的访问权限,   
在获取用户权限后,筛选出相应的路由,动态添加到vue-router实例里,   
获取权限在路由进入之前,所以动态添加路由也在路由进入之前.

```
//path filter/router.js
import router from '@/router/index'
import * as ALL_ROUTE from '@/router/router'
...
...
router.beforeEach((from, to, next) => {
	if(isLogin && !PermissionLock) {
		getPermission().then(res => {
			...

		   let dynamicRoutes  = routerPermissionMap(permission);
          router.addRoutes(dynamicRoutes);
          next({ ...to, replace: true });
		});
	}
})

/* 根据用户权限，获取相应的路由
** @params  permission  { string }  用户权限
** @params 	routes 	    { object }  路由对象
** @return  ret         { array  }  匹配的权限路由
*/
function routerPermissionMap(permission, routes = ALL_ROUTE['permissionRoutes']) {
    let ret = [];
    routes.forEach(route => {
        //如果有子路由,进行递归
        if (!!route.children) {
            route.children = routerPermissionMap(permission, route.children)
        }

        let hasLimit = route.meta && route.meta.permission; //如果没有permission字段表示没有权限限制
        if (!hasLimit || route.meta.permission.some(routePMS => permission.includes(routePMS))) {
            ret.push(route)
        }
    })

    return ret;
}
```

### 具体逻辑

1. 在路由对象下通过meta字段的permission设置该路由的**核心权限**
2. 当用户已登录时,获取用户的权限并匹配出相应的权限路由,**动态添加**到路由实例下

#### 核心权限
一个页面可能会调用多个接口,但决定用户能不能访问页面的是核心权限(接口).

核心权限的意思是**如果用户不能调用该接口,那么它就不能打开该页面**,   
例如详情页,如果它不能调用获取详情的接口,理应不能打开该页面.

非核心权限是**如果用户不能调用该接口,但它也可以访问该页面**,   
例如详情页,如果它不能调用修改详情的接口,但它也能访问详情的页面,只是不能修改.

**为什么核心权限是数组类型,且匹配用户权限时用some方法?**   
考虑这些情况,例如钱包页面,该页有3种模块:余额、收支明细、发票.    
所以页面的核心权限是['余额', '收支明细', '发票'],   
如果用户没有**发票**的权限,但它有**余额**和**收支明细**的权限,   
那么它也能访问该页面.

## 导航权限
如果该导航不显,说明用户没有访问导航页面的权限,   
所以导航也是权限的体现.

```
//path nav.vue 这里使用element-ui
<template>
	<el-menu :default-active="navTo" :router="true">
		<nav-item :routes="dynamicRoutes"></nav-item>
	</el-menu>
</template>

<script>
	import NavItem from './NavItem'
	
	import dataStore from 'dataStore' //封装的数据管理类
	import * as ALL_ROUTE from '@/router/router'
	
	function routerPermissionMap(permission, routes = ALL_ROUTE['permissionRoutes']) {
	    let ret = [];
	    routes.forEach(route => {
	        //如果有子路由,进行递归
	        if (!!route.children) {
	            route.children = routerPermissionMap(permission, route.children)
	        }
	
	        let hasLimit = route.meta && route.meta.permission; //如果没有permission字段表示没有权限限制
	        if (!hasLimit || route.meta.permission.some(routePMS => permission.includes(routePMS))) {
	            ret.push(route)
	        }
	    })
	
	    return ret;
	}

	export default {
		data() {
			return{
				navTo: this.$route.path,
				dynamicRoutes: []
			}
		},
		created() {
			this.dynamicRoutes  = routerPermissionMap(dataStore.storage.get('permission'));
		},
		watch: {
			'$route' (to, from) {
				this.navTo = to.path;
			}
		},
		components: {
			'nav-item': NavItem
		}
	}
</script>
```

一般导航出现在用户登录后,即获取权限后,   
然后筛选出匹配的权限路由,放入子组件.

```
//path NavItem.vue
<template>
	<li>
		<template v-for="(route, index) in navRoutes">
			<el-submenu v-if="hasNavChildren(route)" :index="route.path" class="nav-submenu">
				<template slot="title">
					<span class="nav-menu__icon">
						<svg-icon :icon-name="route.meta.nav.icon" class="nav-menu__svg"></svg-icon>
					</span>
					<span class="nav-menu__text">{{ route.meta.nav.title }}</span>
				</template>

				<el-menu-item-group>
					<nav-item :routes="route.children"></nav-item>
				</el-menu-item-group>
			</el-submenu>

			<el-menu-item v-else 
						  :index="route.path" 
						  :route="{ path: route.path }"
						  :id="route.name"
						  class="nav-menu-item">
				<span class="nav-menu__icon">
					<svg-icon :icon-name="route.meta.nav.icon" class="nav-menu__svg"></svg-icon>
				</span>
				<span class="nav-menu__text" slot="title">{{ route.meta.nav.title }}</span>
			</el-menu-item>
		</template>
	</li>
</template>

<script>

export default {
  	name: 'NavItem',
  	props: {
    	routes: {
      		type: Array
    	},
  	},

  	methods: {
  		hasNavChildren(route) {
			if (!route.children) {
				return false;
			}

			return route.children.some(route => {
				return route.meta && route.meta.nav
			})
		}
  	},

  	computed: {
  		navRoutes() {
  			return this.routes.filter(route => {
  				return route.meta && route.meta.nav;
  			});
  		}
  	}
}
</script>
```

该组件是递归组件,   
首先从父组件传递的权限路由筛选出**导航路由**,   
然后循环渲染导航路由,   
如果导航路由有子路由,着说明可能该**导航有子导航**,所以再次递归.   
如果没有,通过路由对象的meta字段渲染图标和文字.

### 具体逻辑
1. 在导航组件中获取用户权限
2. 并筛选出对应的权限,传递个子组件
3. 子组件通过meta的nav字段判断筛选出导航组件
4. 如果该导航组件拥有子组件,进行递归渲染

## 页面部分权限
页面有些**部分是否显示**是通过权限来决定的,   
例如删除按钮,如果没有删除的权限便不显示. 

```
//path mixins/index.js

import dataStore from 'dataStore'
export default {
	...
	...
	directive: {
		auth: {
			inserted(el, bind) {
				const permission = dataStore.storage.get('permission');
				if(!permission instanceof Array) return;
				
				if(!permission.includes(bind. value)){
					//没有权限
					el.parentElement.removeChild(el)
				}
			}
		}
	}
}

// path a.vue
<template>
	<div>
		....
		<button v-auth="/api/a/delete" @click="deleteEvent"></button>
	</div>
</template>

```

### 具体逻辑
1. 通过全局融合把directive让所有组件继承,
2. 如果页面部分需要权限判断的话,就把该部分对应的权限通过**v-auth**传入,
3. 在auth指令中,获取用户权限,并通过**传入的值做比较**,
4. 如果用户没有该部分权限,**移除该部分的dom**

## 总结
主要思想是 
  
1. 权限的设置是可以通过**后台设置**,不是通过前端写入文件中,不然系统会不灵活.  
2. 在做路由权限时,不需要后端返回,不然增加一个页面,要让后端配置,这样降低前后端分离的思想.
