import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Mini-Vue",
  description: "一个自己实现的vue3 API文档",
  base: '/mini-vue/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
       { text: '开始', link: '/principles/1-reactivity/1-reactive.md' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ceciliaiii/mini-vue' }
    ]
  }
})
