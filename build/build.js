'use strict'
require('./check-versions')()//根据package,检测node和npm版本

process.env.NODE_ENV = 'production'

const ora = require('ora')  //node的loading效果
const rm = require('rimraf')  //操作rm -rf
const path = require('path')
const chalk = require('chalk')  //定义终端字体的颜色
const webpack = require('webpack')
const config = require('../config')
const webpackConfig = require('./webpack.prod.conf')  //生产环境的配置

const spinner = ora('building for production...')
spinner.start()

rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
  //打包后
  if (err) throw err
  webpack(webpackConfig, (err, stats) => {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false, // If you are using ts-loader, setting this to true will make TypeScript errors show up during build.
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
