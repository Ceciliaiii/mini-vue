# setup

```ts
const VueComponent = {
    setup(props, { emit, attrs, expose, slots }) {

        // 提供渲染逻辑
        console.log(props, ...)

        // 可返回函数 / 对象
        return () => {
            return h('div', 'czx')
        }
        // return {
        //     ...
        // }
    },





    // setup优先级最高
    // render() {
    //     return h('div', 'abcd')
    // }
}

render(h(VueComponent, {}), app)
```