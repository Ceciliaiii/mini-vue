// 此文件帮我们打包 packages 文件
// 在包文件中：node dev.js 要打包的文件 -f 打包的格式

import minimist from 'minimist'
import {dirname, resolve} from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import esbuild from 'esbuild'
import { log } from 'console'

// 用 minimist 解析 packages 命令行参数
const args = minimist(process.argv.slice(2))  // { _: [ 'reactivity' ], f: 'esm' }

// esm 使用 commonjs 变量
const __filename = fileURLToPath(import.meta.url)  // 获取文件绝对路径
const __dirname = dirname(__filename)  // 获取文件目录
const require = createRequire(import.meta.url)
const target = args._[0] || 'reactivity' // 打包哪个项目
const format = args.f || 'esm' // 打包的格式

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)  // 打包的入口文件
const pkg = require(`../packages/${target}/package.json`)  // 打包的项目的 package.json 文件
// 根据需要打包
esbuild.context({
    entryPoints: [entry],  // 入口文件
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),  // 出口 打包后的文件名
    bundle: true,  // 打包成一个文件
    platform: 'browser',  // 打包给浏览器使用
    sourcemap: true,  // 可以调试源代码
    format,  // 打包的格式
    globalName: pkg.buildOptions?.name,
}).then((ctx) => {
    console.log(`Build ${target} success!`);

    return ctx.watch() // 监控入口文件持续进行打包处理
})