// 此文件帮我们打包 packages 文件
// 在包文件中：node dev.js 要打包的文件 -f 打包的格式

import minimist from 'minimist'

// 用 minimist 解析 packages 命令行参数
const args = minimist(process.argv.slice(2))  // { _: [ 'reactivity' ], f: 'esm' }

const target = args._[0] || 'reactivity' // 打包哪个项目

const format = args.f || 'esm' // 打包的格式

console.log(target, format); // reactivity esm

