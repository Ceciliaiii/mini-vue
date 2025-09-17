# ast 编译
把我们写的模板字符串（比如 `<div>Hello {{ name }}</div>`），转换成一棵结构化的 “抽象语法树”（AST）。

## 文本解析
模板里的文本分两种：固定的纯文字（比如 “Hello”）、动态插值，AST 会把它们拆成不同类型的节点。

### 纯文本解析
找到文本的 “边界”（遇到 `<` 标签开头或 `{` 插值开头就停止），把中间的内容提取出来，生成 “文本节点”。  
以 Hello 为例，解析后生成的文本节点如下：
```ts
{
  type: NodeTypes.TEXT,  // 标记是文本类型
  content: "Hello ",    // 文本内容
  loc: { ... }          // 位置信息（记录在模板里的行数/列数，方便报错）
}
```

### 插值表达式解析
先找到插槽 `前后双括号` 的位置，去掉前后空格，把里面的表达式（比如 `name`）提取出来，生成 “插值节点”，同时标记这是动态内容。
```ts
// 模板片段：{{ name }}

// 解析后的插值节点
{
  type: NodeTypes.INTERPOLATION,  // 标记是插值类型
  content: {                      // 插值里的表达式内容
    type: NodeTypes.SIMPLE_EXPRESSION,  // 简单表达式
    isStatic: false,              // 不是静态的（是动态的）
    content: "name",              // 表达式核心（比如 name）
    loc: { ... }
  },
  loc: { ... }
}
```

## 元素解析
解析时会把标签拆成 “标签名”“子节点”“闭合标签” 三部分，生成 “元素节点”。
### 先解析开标签（比如 `<div class="box">`）
提取标签名（比如 `div`），判断是不是自闭合标签（比如 `<img/>`），同时留空准备后续解析属性。

### 再递归解析子节点
元素里面的内容（比如 `<div> 里面的文本/其他标签 </div>`），会递归调用文本 / 元素解析逻辑，把所有子节点收集起来。

###  最后处理闭标签（比如 `</div>`）
闭标签本身不生成节点，避免继续解析多余内容。
```ts
// 模板片段：<div class="box">Hello {{ name }}</div>

// 解析后的元素节点
{
  type: NodeTypes.ELEMENT,  // 标记是元素类型
  tag: "div",               // 标签名
  isSelfClosing: false,     // 不是自闭合标签
  props: [ ... ],           // 元素的属性（后面会讲，这里先留空）
  children: [               // 子节点（文本节点 + 插值节点）
    { type: NodeTypes.TEXT, content: "Hello " },
    { type: NodeTypes.INTERPOLATION, content: { ... } }
  ],
  loc: { ... }
}
```

## 元素属性解析
元素上的属性，会被拆成 “属性名” 和 “属性值”，生成 “属性节点”，再挂载到对应元素节点的 `props` 里。

### 批量解析所有属性
比如 `<div class="box" id="main">`，会循环解析每个属性，直到遇到标签结束符 `>`。

### 单个属性解析（比如 `class="box"`）
先提取属性名，再处理属性值：
 - 如果值用引号包裹（比如 `"box"`），就去掉引号取里面的内容；
 - 如果没引号，就取到空格或标签结束为止。

```ts
// 模板片段：<div class="box" id="main">

// 解析后元素节点的 props 数组：
props: [
  {
    type: NodeTypes.ATTRIBUTE,  // 标记是属性类型
    name: "class",              // 属性名
    value: {                    // 属性值
      type: NodeTypes.TEXT,
      content: "box"
    },
    loc: { ... }
  },
  {
    type: NodeTypes.ATTRIBUTE,
    name: "id",
    value: {
      type: NodeTypes.TEXT,
      content: "main"
    },
    loc: { ... }
  }
]
```

## 去除多余元素：清理 “无用的空白内容”
模板里常会有**换行、缩进**的空格（比如写模板时的换行），这些内容会被解析成无意义的空白文本节点，需要过滤掉，同时把连续的空格合并成一个。  
比如模板：
```html
<div>
  Hello {{ name }}
</div>
```
解析时会先把 `<div>` 内的换行、缩进当成空白文本节点，最后过滤掉，只保留 “Hello” 和 `插值name` 对应的有效节点。  
子节点数组过滤前：
```ts
[
  { type: NodeTypes.TEXT, content: "\n  " },  // 换行+缩进（空白）
  { type: NodeTypes.TEXT, content: "Hello " }, // 有效文本
  { type: NodeTypes.INTERPOLATION, content: { ... } }, // 有效插值
  { type: NodeTypes.TEXT, content: "\n" }     // 换行（空白）
]
```
过滤后：
```ts
[
  { type: NodeTypes.TEXT, content: "Hello " },
  { type: NodeTypes.INTERPOLATION, content: { ... } }
]
```

## 最终生成完整的 AST 根节点
所有内容解析完后，会把最外层的节点（比如**整个模板的内容**）包裹成 “根节点”，形成一棵完整的 AST 树。  
例如模板  `<div class="box">Hello {{ name }}</div>`：
```ts
{
  type: NodeTypes.ROOT,  // 根节点
  children: [            // 根节点的子节点（只有一个div元素）
    {
      type: NodeTypes.ELEMENT,
      tag: "div",
      props: [
        { type: NodeTypes.ATTRIBUTE, name: "class", value: { ... } }
      ],
      children: [
        { type: NodeTypes.TEXT, content: "Hello " },
        { type: NodeTypes.INTERPOLATION, content: { ... } }
      ],
      loc: { ... }
    }
  ],
  loc: { ... }
}
```