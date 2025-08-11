// 此文件帮我们打包 packages 文件
// 在包文件中：node dev.js 要打包的文件 -f 打包的格式

import minimist from 'minimist'
import {dirname, resolve} from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
// 用 minimist 解析 packages 命令行参数
const args = minimist(process.argv.slice(2))  // { _: [ 'reactivity' ], f: 'esm' }

// esm 使用 commonjs 变量
const __filename = fileURLToPath(import.meta.url)  // 获取文件绝对路径
const __dirname = dirname(__filename)  // 获取文件目录
const require = createRequire(import.meta.url)
const target = args._[0] || 'reactivity' // 打包哪个项目
const format = args.f || 'esm' // 打包的格式

console.log(target, format); // reactivity esm

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)  // 打包的入口文件

// 根据需要打包
