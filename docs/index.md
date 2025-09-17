---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Mini-Vue"
  text: "保姆级Vue3开发手册"
  tagline: "实现最简单的Vue模型"
  actions:
    - theme: brand
      text: 开始
      link: /1-reactivity/1-reactive.md
    - theme: alt
      text: 使用示例
      link: /examples/1-reactivity/1-reactive.md

features:
  - title: reactivity
    details: 实现数据响应式
    link: /1-reactivity/1-reactive.md
    linkText: Learn more
  - title: runtime-dom
    details: 浏览器环境平台
    link: /2-runtime-dom/1-nodeOps.md
    linkText: Learn more
  - title: runtime-core
    details: 跨平台渲染逻辑核心
    link: /3-runtime-core/1-watch.md
    linkText: Learn more
  - title: compiler-core
    details: 模板编译核心
    link: /4-compiler-core/1-ast编译.md
    linkText: Learn more
---