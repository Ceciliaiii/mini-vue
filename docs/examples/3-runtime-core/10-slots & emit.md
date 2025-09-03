# slots & emit

## slot
```ts
// 子组件  触发 update 渲染 父组件
const VueComponent = {
    setup(props, { emit, attrs, expose, slots }) {
        return (proxy) => {

            // 第二个参数是props 需要为null，第三个参数才是插槽
            return h(RenderComponent, null, {
                default: (t) => h('div', '默认插槽内容' + t), // 默认插槽
                header: (t) => h('header', 'header' + t),   // 具名插槽
                footer: (t) => h('footer', 'footer' + t)
            })
        }
    }
}

// 父组件   渲染内容
const RenderComponent = {
    render(proxy) {

        console.log(proxy.$slots)

        return h(Flagment, [
            
            // 渲染文本：footerfff    headerhhh
            proxy.$slots.footer('fff'),
            proxy.$slots.header('hhh')
        ])
    }
}



render(h(VueComponent, {}), app)
```