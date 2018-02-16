'use strict'
const chalk = require('chalk')  //定义终端字体的颜色
const semver = require('semver')  //管理npm依赖包版本控制
const packageConfig = require('../package.json')
const shell = require('shelljs')  //使用shell命令
//执行命令
function exec (cmd) {
  return require('child_process').execSync(cmd).toString().trim()
}

const versionRequirements = [
  {
    name: 'node',
    currentVersion: semver.clean(process.version),  //node版本
    versionRequirement: packageConfig.engines.node  //package的node版本范围
  }
]

if (shell.which('npm')) {
  versionRequirements.push({
    name: 'npm',
    currentVersion: exec('npm --version'),    //npm版本
    versionRequirement: packageConfig.engines.npm //npm版本范围
  })
}
//检测版本
module.exports = function () {
  const warnings = []

  for (let i = 0; i < versionRequirements.length; i++) {
    const mod = versionRequirements[i]

    if (!semver.satisfies(mod.currentVersion, mod.versionRequirement)) {
      warnings.push(mod.name + ': ' +
        chalk.red(mod.currentVersion) + ' should be ' +
        chalk.green(mod.versionRequirement)
      )
    }
  }

  if (warnings.length) {
    console.log('')
    console.log(chalk.yellow('To use this template, you must update following to modules:'))
    console.log()

    for (let i = 0; i < warnings.length; i++) {
      const warning = warnings[i]
      console.log('  ' + warning)
    }
    //退出程序
    console.log()
    process.exit(1)
  }
}
