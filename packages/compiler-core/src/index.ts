// 分为三部：1. 将模板转换为ast语法树     2. 转化生产codegennode    3. 转化成render函数

import { NodeTypes } from "./ast"

function createParserContext(content) {
    return {
        originalSource: content,
        source: content,   // 字符串会不停的减少
        line: 1,
        column: 1,
        offset: 0
    }
}

function isEnd(context) {
  const c = context.source

  if (c.startsWith('</')) { // 遇到结束标签 也要停止
    return true
  }
  return !context.source
}


function advancePositionMutation(context, c, endIndex) {
  let linesCount = 0 // 第几行
  let linePos = -1 // 换行的位置信息

  for (let i = 0; i < endIndex; i++) {
    if (c.charCodeAt(i) === 10) { // ASCII码 中 10 代表换行符 “LF”
      linesCount++
      linePos = i
    }
  }
  context.offset += endIndex
  context.line += linesCount
  context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
}

function advanceBy(context, endIndex) {
  const c = context.source
  advancePositionMutation(context, c, endIndex)
  context.source = c.slice(endIndex)
}


function parseTextData(context, endIndex) {
    const content = context.source.slice(0, endIndex)
    advanceBy(context, endIndex)

    return content
}

function parseInterpolation(context) {
  const start = getCursor(context) // 记录开始位置

  const closeIndex = context.source.indexOf('}}', 2) // 找到结束位置

  advanceBy(context, 2) // 去掉开头的 {{

  // 原本： {{ name }} 去掉之后 : name }}
  const innerStart = getCursor(context) // 记录内部开始位置
  const innerEnd = getCursor(context) // 记录内部结束位置

  // "{{ name }}" -> " name "
  const preTrimContent = parseTextData(context, closeIndex - 2) // 解析内部内容

  // " name " -> "name"
  const content = preTrimContent.trim() // 去掉空格

  const startOffset = preTrimContent.indexOf(content) // 找到偏移量
  if (startOffset > 0) { // 偏移量大于0 说明有空格
    advancePositionMutation(innerStart, preTrimContent, startOffset) // 移动内部开始位置
  }

  const endOffset = startOffset + content.length // 找到内部结束位置
  advancePositionMutation(innerEnd, preTrimContent, endOffset) // 移动内部结束位置

  advanceBy(context, 2) // 去掉结尾的 }}

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false, // 静态
      isConstant: false, // 常量
      content, // 表达式内容
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  }
}

function parseText(context) {
    let tokens = ['<', '{']   // 找文本当前离得最近的词法

    let endIndex = context.source.length   // 先假设找不到

    for(let i = 0; i < tokens.length; i++) {
        const index = context.source.indexOf(tokens[i])
        if(index !== -1 && endIndex > index) {
            endIndex = index
        }
    }

    let content = parseTextData(context, endIndex)
    // 0-endIndex 为文字内容

    return {
        type: NodeTypes.TEXT,
        content,
    }
}


function advanceSpaces(context) {
    const match = /^[ \t\r\n]+/.exec(context.source)

    if(match) {   // 删除空格
        advanceBy(context, match[0].length)
    }
}

function getCursor(context) {
  const { line, column, offset } = context
  return { line, column, offset }
}


function getSelection(context, start, e?) {
  const end = e || getCursor(context)

  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  }
}


function parseAttributeValue(context) {
    let quote = context.source[0]

    const isQuoted = quote === '"' || quote === ''

    let content
    if(isQuoted) {
        advanceBy(context, 1)
        const endIndex = context.source.indexOf(quote, 1)

        content = parseTextData(context, endIndex)
        advanceBy(context, 1)
    }
    else {

        context.source.match(/([^ \t\r\n/>])+/)[1]  // 取出内容，删除空格
        advanceBy(context, content.length)
        advanceSpaces(context)
    }

    return {
        type: NodeTypes.TEXT,
        content
    }
}


function parseAttribute(context) {

    const start = getCursor(context)

    // a = '1'
    let match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)

    const name = match[0]

    let value

    advanceBy(context, name.length)
    if(/^[\t\r\n\f ]*=/.test(context.source)) {
        advanceSpaces(context)
        advanceBy(context, 1)
        advanceSpaces(context)
        value = parseAttributeValue(context)
    }

    let loc = getSelection(context, start)
    return {
        type: NodeTypes.ATTRIBUTE,
        name: '',
        value: {
            type: NodeTypes.TEXT,
            content: value,
            loc: loc
        },
        loc: getSelection(context, start)
    }
}

function parseAttributes(context) {
    const props = []

    while(context.source.length > 0 && !context.source.startsWith('>')) {
        props.push(parseAttribute(context))
        advanceSpaces(context)
    }

    return props
}



function parseTag(context){

    const start = getCursor(context)
    const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
    const tag = match[1]

    advanceBy(context, match[0].length)   // 删除匹配到的内容

    advanceSpaces(context)   // 删除 <div  /> 里的空格


    // <div a="1"  a='1'>

    let props = parseAttributes(context)

    const isSelfClosing = context.source.startsWith('/>')

    advanceBy(context, isSelfClosing ? 2 : 1 )
     return {
        type: NodeTypes.ELEMENT,
        tag,
        isSelfClosing,
        loc: getSelection(context, start),   // 开头标签解析后的信息
     }

}

function parseElement(context) {
    // <div>

    const ele = parseTag(context);

    const children = parseChildren(context)   // 递归解析儿子节点，解析时如果是结尾标签需要跳过

    if(context.source.startsWith('</')) {   //  <div></div>
        parseTag(context)   // 闭合标签不考虑  没有意义 直接移除
    }

    (ele as any).children = [];

    (ele as any).loc = getSelection(context, ele.loc.start);

    return ele
}


function parseChildren(context) {
    const nodes = [] as any
    while(!isEnd(context)) {

        const c = context.source   // 现在解析的内容
        let node


        if(c.startsWith('{{')) {    //  {{}}
            node = parseInterpolation(context)    
        }
        else if(c[0] === '<') {     // <div>
           node = parseElement(context)
        }
        else {     // 文本      情况：文本    <div></div>{{name}}
            node = parseText(context)
        }
    
        nodes.push(node)
        
    }

    for(let i = 0; i < nodes.length; i++) {
        let node = nodes[i]

        if (!/[^\t\r\n\f ]/.test(node.content)) {
            nodes[i] = null   // 删除空白字符串
        }
        else {
            node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
        }
    }

    return nodes.filter(Boolean)
}



function createRoots(children) {
    return {
        type: NodeTypes.ROOT,
        children
    }
}


function parse(template) {

    // 需要根据template产生一棵树

    const context = createParserContext(template)


    return createRoots(parseChildren(context))
}

export { parse }