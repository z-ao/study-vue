'use strict'
const utils = require('./utils')    //提取打包vue里面的工具函数
const webpack = require('webpack')
const config = require('../config') //webpack的配置信息
const merge = require('webpack-merge')  //合并webpack的配置文件
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')  //公共weboack配置文件
const CopyWebpackPlugin = require('copy-webpack-plugin')  //复制单个文件或者整个目录从而建立目录
const HtmlWebpackPlugin = require('html-webpack-plugin')  //在模版生成html
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')  //webpack错误信息提示插件
const portfinder = require('portfinder')  //找到当前系统的开放端口

const HOST = process.env.HOST //获取环境变量的域名
const PORT = process.env.PORT && Number(process.env.PORT) //获取环境变量的端口
//开发环境的webpack配置
const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  //生成source maps配置
  //使用cheap-module-eval-source-map因为速度快
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  devServer: {
    //配置开发工具显示日志的级别
    clientLogLevel: 'warning',
    //当使用h5的histroyAPI时
    //定义404的返回页面
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    hot: true, //启用 webpack 的模块热替换特性
    //定义静态资源的目录
    //这里禁用了,因为使用了CopyWebpackPlugin插件
    contentBase: false, // since we use CopyWebpackPlugin.
    //一切服务都启用gzip 压缩
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    //是否自动打开浏览器
    open: config.dev.autoOpenBrowser,
    //当编译出错时是否出现全屏的蒙层显示
    overlay: config.dev.errorOverlay
      ? { warnings: false, errors: true }
      : false,
    publicPath: config.dev.assetsPublicPath, //此路径下的打包文件可在浏览器中访问
    proxy: config.dev.proxyTable, //后端开发服务器 API代理url
    //启用 quiet 后，除了初始启动信息之外的任何内容都不会被打印到控制台。这也意味着来自 webpack 的错误或警告在控制台不可见
    quiet: true, // necessary for FriendlyErrorsPlugin
    //监视文件相关的控制选项
    //这里禁止使用轮询
    watchOptions: {
      poll: config.dev.poll,
    }
  },
  plugins: [
    new webpack.DefinePlugin({  //定义全局的变量
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(), //启动热加载
    //显示更新的文件名在控制台
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    //出错不会阻塞,当结束后会报错
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    //生成html的插件
    new HtmlWebpackPlugin({
      //生成html文件名
      filename: 'index.html',
      //目标的模版
      template: 'index.html',
      //所有的静态资源插入尾部
      inject: true
    }),
    //复制静态文件
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

//设置项目的端口
module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})
