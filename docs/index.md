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
  - title: runtime-core
    details: 框架运行核心
    link: /2-runtime-core/1-watch.md
    linkText: Learn more
  - title: runtime-dom
    details: 浏览器环境适配层
    link: /3-runtime-dom/1-nodeOps.md
    linkText: Learn more
---