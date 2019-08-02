#!/usr/bin/env node
const program = require('commander')
const path = require('path')
const fs = require('fs')
const download = require('download-git-repo')
const inquirer = require('inquirer')
const Handlebars = require('handlebars')
const ora = require('ora')

function downloadRepo(targetDir) {
  return new Promise((resolve, reject) => {
    const REPO_URL = 'https://github.com:OuZuYu/vue-template#master'
    const spinner = ora(`正在下载模版，源地址：${REPO_URL}`)
    spinner.start()
    download(REPO_URL, targetDir, {
      clone: true
    }, err => {
      if (err) {
        spinner.fail()
        reject(err)
        return
      } else {
        spinner.succeed()
        resolve(targetDir)
      }
    })
  })
}

program
  .version('1.0.0', '-v, --version')
  .usage('<-i> [项目名称]')
  .option('-i, --init <name>', '初始化一个app模版')
  .parse(process.argv)

const appName = program.init
const curDir = process.cwd()
const baseName = path.basename(curDir)
const list = fs.readdirSync(curDir)
let targetDir = path.resolve(curDir, appName)
let next = Promise.resolve(appName)

if (!appName) {
  program.help()
  return
}

if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
  console.log(`目录${appName}已存在`)
  return
}

if (!list.length && baseName === appName) {
  next = inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: '当前目录为空，且目录名与您将要创建的app目录名相同，直接在此目录创建吗？',
      type: 'confirm',
    }
  ]).then(answer => {
    return answer.buildInCurrent ? '.' : appName
  })
}

next.then(targetDir => {
  return downloadRepo(targetDir)
}).then(targetDir => {
  inquirer.prompt([
    {
      name: 'projectName',
      message: '项目名称',
      default: appName
    },
    {
      name: 'projectVersion',
      message: '项目版本号',
      default: "1.0.0"
    },
    {
      name: 'projectDescription',
      message: '项目描述',
    }
  ]).then(answers => {
    const packageJsonPath = path.resolve(curDir, targetDir, 'package.json')
    const packageJson = fs.readFileSync(packageJsonPath, 'utf-8')
    const temp = Handlebars.compile(packageJson)
    const result = temp(answers)
    fs.writeFileSync(packageJsonPath, result)
  })
})