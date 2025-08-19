import { defineConfig } from 'vitepress'
import sidebar from '../sideBar' // 导入侧边栏配置

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Mini-Vue",
  description: "一个自己实现的vue3 API文档",
  base: '/mini-vue/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    sidebar: sidebar,
    nav: [
      { text: 'Home', link: '/' },
      { text: '开始', link: '/1-reactivity/1-reactive' },
      { text: '使用示例', link: '/examples' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ceciliaiii/mini-vue' }
    ]
  }
})
