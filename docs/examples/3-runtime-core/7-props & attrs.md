# 组件 attr & props
所有属性 - propsOptions（响应式） = attrs（非响应式）
```ts
const VueComponent = {
    props: {
        // defineProps()
        name: String,
        age: Number
    },
    data() {
        return { name: 'czx', age: 21 }
    },
    render(proxy) {
        return h("div", [h(Text, "my name is "+ proxy.name), h("a", proxy.$attrs.a)])
    }
}


render(h(VueComponent, {a: 1, b: 2}), app)

```