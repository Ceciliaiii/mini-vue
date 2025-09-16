# ast 编译
AST（抽象语法树）是 Vue 模板编译的核心中间产物，负责将字符串形式的模板转换为结构化的树状数据，为后续生成渲染函数（render）提供基础。  
AST 编译在**文本、元素、元素属性、冗余元素处理**四个维度有明确的实现逻辑。

## 文本解析：识别纯文本与插值表达式
模板中的 “文本” 包含两种形式：纯静态文本、插值表达式，要区分静态与动态文本，精准提取内容；

### `parseText`：纯文本解析
提取模板中 “非标签、非插值” 的纯文本内容，逻辑是 “找到最近的边界符（< 或 { ），截取中间内容”：
```ts
function parseText(context) {
  // 文本的边界符：遇到 `<`（标签开始）或 `{`（插值开始）则停止
  let tokens = ['<', '{'];  
  let endIndex = context.source.length; // 初始假设文本占满剩余内容

  // 找到最近的边界符位置
  for (let i = 0; i < tokens.length; i++) {
    const index = context.source.indexOf(tokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index; // 更新为最近的边界符位置
    }
  }

  // 提取 [0, endIndex) 的 content 作为纯文本
  let content = parseTextData(context, endIndex);
  return { 
    type: NodeTypes.TEXT,
    content 
  }; // 返回文本节点，标记类型为 TEXT
}
```
示例：模板 `<div>Hello </div>` 中，“Hello” 会被解析为 `type: TEXT` 的节点，`content: "Hello "`。


### `parseInterpolation`：插值表达式解析
负责提取 插值 包裹的动态表达式：定位大括号边界，清理空格，并提取表达式内容；
```ts
function parseInterpolation(context) {
  const start = getCursor(context); // 记录表达式开始位置（用于定位错误）
  
  // 定位结束边界 `}}`
  const closeIndex = context.source.indexOf('}}', 2);
  // 从上下文删除开头 {{ 
  advanceBy(context, 2); 

  // 提取插值内容
  const preTrimContent = parseTextData(context, closeIndex - 2);
  // 清理前后空格（得到 `name`）
  const content = preTrimContent.trim(); 

 // 从上下文删除结尾 `}}`
  advanceBy(context, 2);

  // 返回插值节点：类型为 INTERPOLATION，内容是 SIMPLE_EXPRESSION（动态表达式）
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false, // 标记为动态（非静态）
      content: content, // 表达式核心内容（如 `name`）
      loc: getSelection(context, innerStart, innerEnd) // 位置信息（用于报错）
    },
    loc: getSelection(context, start)
  };
}
```

## 元素解析：识别标签结构（开标签、子节点、闭标签）
分三步：解析开标签（含标签名、自闭合）→ 递归解析子节点 → 解析闭标签；


### `parseTag`：开标签解析
负责提取标签名、是否自闭合，以及后续属性解析的前置处理：
```ts
function parseTag(context) {
  const start = getCursor(context);

  // 正则匹配开标签/闭标签：如 `<div` 或 `</div`，提取标签名（如 `div`）
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  const tag = match[1]; // 标签名（如 `div`）

  // 删除匹配过的 `<div` 或 `</div`
  advanceBy(context, match[0].length); 
  advanceSpaces(context); // 清理标签内的空格（如 `<div  class="a">` 中的多余空格）

  // 后续会调用 parseAttributes 解析标签属性
  let props = parseAttributes(context);

  // 判断是否自闭合标签（如 `<img/>`）
  const isSelfClosing = context.source.startsWith('/>');
  advanceBy(context, isSelfClosing ? 2 : 1); // 删除 `/>` 或 `>`

  // 返回元素标签节点：标记类型为 ELEMENT，包含标签名、自闭合状态
  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
    isSelfClosing: isSelfClosing,
    loc: getSelection(context, start)
  };
}
```


### `parseChildren`：子节点递归解析
元素可能包含子节点（文本、其他元素、插值等），`parseChildren` 会递归调用文本 / 元素 / 插值解析函数，收集所有子节点：
```ts
function parseChildren(context) {
  const nodes = [];

  // 循环解析，直到遇到闭标签（由 isEnd 判断：是否以 `</` 开头）
  while (!isEnd(context)) {
    const c = context.source;
    let node;

    // 插值表达式
    if (c.startsWith('{{')) {               
      node = parseInterpolation(context);
    } 
     // 元素标签
     else if (c[0] === '<') {              
      node = parseElement(context);
    } 
      // 纯文本
     else {                               
      node = parseText(context);
    }

    // 收集子节点
    nodes.push(node);                       
  }
  // 后续会处理冗余空格
  return nodes.filter(Boolean);
}
```


### `parseElement`：元素完整解析
整合开标签、子节点、闭标签，生成完整的元素节点：
```ts
function parseElement(context) {
  
  // 解析开标签（如 `<div class="a">`）
  const ele = parseTag(context);
  
  // 递归解析子节点（如 div 内部的文本、其他元素）
  const children = parseChildren(context);
  
  // 解析闭标签（如 `</div>`，仅清理上下文，不生成节点）
  if (context.source.startsWith('</')) {
    parseTag(context);
  }
  
  // 补充子节点和位置信息，返回完整元素节点
  ele.children = children;
  ele.loc = getSelection(context, ele.loc.start);
  return ele;
}
```
示例：
```ts
// 模板 <div>Hello {{ name }}</div>

// 解析为：
{
    type: ELEMENT,
    tag: 'div',
    children: [
        { type: TEXT, content: '文本' },
        { type: INTERPOLATION, 
          content: { 
                type: SIMPLE_EXPRESSION,
                content: 插值内容
            } 
        }
    ]
}
```


## 元素属性解析：提取标签属性（名与值）
如 `class="a"`、`:id="dynamicId"`，分离属性名和值，处理引号包裹的情况。
### `parseAttributes`：批量解析属性
循环提取标签内的所有属性，直到遇到标签结束符（> 或 />）：
```ts
function parseAttributes(context) {
  const props = [];

  // 循环条件：还有内容 + 未到标签结束（`>`）
  while (context.source.length > 0 && !context.source.startsWith('>')) {
    props.push(parseAttribute(context)); // 解析单个属性，加入数组
    advanceSpaces(context); // 清理属性间的空格（如 `class="a"  id="b"`）
  }
  return props; // 返回属性数组
}

```

### `parseAttribute + parseAttributeValue`：单个属性解析
解析属性名与值的关联（parseAttribute）：
```ts
function parseAttribute(context) {
  const start = getCursor(context);
  // 正则匹配属性名（如 `class`、`:id`）：排除空格、`>`、`=` 等特殊字符
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0]; // 属性名（如 `class`）
  advanceBy(context, name.length); // 删除已解析的属性名

  let value = null;
  // 判断是否有属性值（是否包含 `=`）
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context); // 清理 `=` 前的空格（如 `class  = "a"`）
    advanceBy(context, 1); // 删除 `=`
    advanceSpaces(context); // 清理 `=` 后的空格
    value = parseAttributeValue(context); // 解析属性值
  }

  // 返回属性节点：类型为 ATTRIBUTE，包含名和值
  return {
    type: NodeTypes.ATTRIBUTE,
    name: name,
    value: value, // 由 parseAttributeValue 生成的 TEXT 节点
    loc: getSelection(context, start)
  };
}
```
解析属性值（parseAttributeValue），处理属性值的引号包裹情况（如 "a"、'b' 或无引号）：
```ts
function parseAttributeValue(context) {
  let quote = context.source[0];
  const isQuoted = quote === '"' || quote === "'"; // 是否有引号

  let content;
  if (isQuoted) {
    advanceBy(context, 1); // 删除开头引号（如 `"`）
    const endIndex = context.source.indexOf(quote, 1); // 找到结尾引号位置
    content = parseTextData(context, endIndex); // 提取引号间的内容（如 `a`）
    advanceBy(context, 1); // 删除结尾引号
  } else {
    // 无引号情况：匹配到空格或标签结束符为止（如 `class=a` 中的 `a`）
    const match = context.source.match(/([^ \t\r\n/>])+/);
    content = match[1];
    advanceBy(context, content.length);
  }

  // 返回属性值节点：类型为 TEXT（静态值）
  return { type: NodeTypes.TEXT, content: content };
}
```

## 去除多余元素：清理空白文本节点
模板中常存在冗余空格（如换行、缩进），这些空格会被解析为无意义的文本节点，通过 “过滤纯空白文本” 和 “合并连续空格” 优化 AST 结构，避免冗余渲染。
```ts
function parseChildren(context) {
  const nodes = [];
  // ... 前面解析文本、元素、插值，收集 nodes ...

  // 处理冗余文本节点
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    // 过滤纯空白文本：匹配仅包含空格、制表符、换行符的内容
    if (node.type === NodeTypes.TEXT && !/[^\t\r\n\f ]/.test(node.content)) {
      nodes[i] = null; // 标记为 null，后续过滤
    } 
    // 合并连续空格：将多个空白字符替换为单个空格
    else if (node.type === NodeTypes.TEXT) {
      node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
    }
  }

  return nodes.filter(Boolean); // 过滤掉 null（纯空白文本节点）
}
```
示例：
```html
<div>
  Hello {{ name }}
</div>
```
`div` 内的换行和缩进会被解析为纯空白文本节点，最终被过滤；  
“Hello” 和 插值 之间的空格会被合并为单个空格，AST 中仅保留有效文本节点。