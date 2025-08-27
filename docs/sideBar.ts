export default {
       '/': [
              { 
                text: '1-reactivity', 
                base: '/1-reactivity/',
                collapsible: true, // 可折叠
                collapsed: false,
                items: [
                  { text: '1. reactive', link: '1-reactive' },
                  { text: '2. effect', link: '2-effect' },
                  { text: '3. 依赖收集 & 触发更新', link: '3-依赖收集&触发更新' },
                  { text: '4. 依赖清理', link: '4-依赖清理' },
                  { text: '5. effect调度', link: '5-scheduler' },
                  { text: '6. 防止递归调用 & 深度代理', link: '6-防止递归调用&深度代理' },
                  { text: '7. ref', link: '7-ref' },
                  { text: '8. toRef & toRefs & proxyRefs', link: '8-toRef & toRefs & proxyRefs' },
                  { text: '9. computed', link: '9-computed' },
                ]
              },
              {
                text: '2-runtime-dom',
                base: '/2-runtime-dom/',
                collapsible: true, // 可折叠
                collapsed: false,
                items: [
                  { text: '1. nodeOps', link: '1-nodeOps' },
                  { text: '2. patchProp', link: '2-patchProp' }
                 ]
              },
              {
                text: '3-runtime-core',
                base: '/3-runtime-core/',
                collapsible: true, // 可折叠
                collapsed: false,
                items: [
                  { text: '1. watch', link: '1-watch' },
                  { text: '2. watchEffect', link: '2-watchEffect' },
                  { text: '3. 清理函数', link: '3-清理函数' },
                  { text: '4. 虚拟DOM渲染', link: '4-虚拟dom渲染' },
                  { text: '5. h函数', link: '5-h函数' },
                  { text: '6. 比较策略', link: '6-比较策略' },
                 ]
              },
          ],
          '/examples/': [
            {
              text: '使用示例',
              items: [
                {
                  text: '1-reactivity',
                  base: '/examples/1-reactivity/',
                  collapsible: true,
                   collapsed: false,
                   items: [
                    { text: '1. reactive', link: '1-reactive' },
                    { text: '2. effect', link: '2-effect' },
                    { text: '3. scheduler', link: '3-scheduler' },
                    { text: '4. Ref', link: '4-ref' },
                    { text: '5. computed', link: '5-computed' }
                   ]
                },
                {
                  text: '2-runtime-dom',
                  base: '/examples/2-runtime-dom/',
                  collapsible: true,
                  collapsed: false,
                  items: [
                    { text: '1. 节点元素操作', link: '1-节点元素操作' },
                  ]
                },
                {
                  text: '3-runtime-core',
                  base: '/examples/3-runtime-core/',
                  collapsible: true,
                  collapsed: false,
                  items: [
                    { text: '1. watch', link: '1-watch' },
                    { text: '2. watchEffect', link: '2-watchEffect' },
                    { text: '3. 清理函数', link: '3-清理函数' },
                    { text: '4. h函数', link: '4-h函数' },
                  ]
                },
                
              ]
            }
          ]
        
    }