# Vue 组件渲染

```ts
const VueComponent = {
    data() {
        return { name: 'czx', age: 21 }
    },
    render() {
        // this == 组件实例
        return h("div", [h(Text, "my name is "+ this.name), h("a", this.age)])
    }
}

// 组件由两个虚拟节点组成 
// h(VueComponent) 产生的是组件内的虚拟节
// render 函数返回的虚拟节点，这个虚拟节点才是最终要渲染的内容
render(h(VueComponent), app)
```