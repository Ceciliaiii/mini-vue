# 子节点 diff 对比
处理的场景是：新旧子节点均为数组（且子节点都有唯一 `key`），例如：
 - 老节点数组 c1：`[a(key='a'), b('b'), c('c'), e('e'), f('f'), d('d')]`
 - 新节点数组 c2：`[a('a'), b('b'), d('d'), q('q'), f('f'), d('d')]`


## 从头比对（相同前缀复用）
从数组起始位置开始，逐一对比新旧子节点，遇到 “不同节点” 则停止，相同节点直接复用并更新差异：
```ts
// 例如比对 [a,b,c,e,f,d] 和 [a,b,d,q,f,d]
// i 最终为2时停止

let i = 0; // 起始索引
let e1 = c1.length - 1; // 老数组尾部索引
let e2 = c2.length - 1; // 新数组尾部索引

while (i <= e1 && i <= e2) {
  const n1 = c1[i];
  const n2 = c2[i];
  if (isSameVnode(n1, n2)) { // 通过 key + type 匹配
    patch(n1, n2, el); // 复用节点，更新属性/子节点
  } else {
    break; // 遇到不同节点，停止从头比对
  }
  i++;
}
```


## 从尾比对（相同后缀复用）
```ts
// 例如比对 [a,b,c,e,f,d] 和 [a,b,d,q,f,d]
// 最终 e1=3、e2=3 时停止

while (i <= e1 && i <= e2) {
  const n1 = c1[e1];
  const n2 = c2[e2];
  if (isSameVnode(n1, n2)) {
    patch(n1, n2, el); // 复用节点
  } else {
    break; // 遇到不同节点，停止从尾比对
  }
  e1--; // 老数组尾部左移
  e2--; // 新数组尾部左移
}
```
最终 `i=2、e1=3、e2=3`。


## 新增 & 删除
经过前两步，数组中间部分是 “未匹配的差异区”，此时分两种情况处理：
### 新数组有剩余，新增节点
当 i > e1，i <= e2：
```ts
// 例如：[a,b]、[a,b,c,d]，剩余新数组[c, d]
// anchor 为 null，cd插入到尾部

if (i > e1) {
  if (i <= e2) {
    const nextPos = e2 + 1; // 插入的参考位置（新数组剩余节点的下一个位置）
    const anchor = c2[nextPos]?.el; // 参考节点（DOM 插入时的“锚点”）
    while (i <= e2) {
      patch(null, c2[i], el, anchor); // 从锚点前插入新增节点
      i++;
    }
  }
}
```

### 老数组有剩余，删除节点
当 i > e2，i <= e1：
```ts
// 例如：[a, b, c, d]、[a, b]，剩余老数组[c, d]
// 前两步对比完，i=2、e1=3、e2=1，删除cd

else if (i > e2) {
  if (i <= e1) {
    while (i <= e1) {
      unmount(c1[i]); // 删除老数组剩余节点
      i++;
    }
  }
}
```


## 处理“中间差异区”（复用 + 移动节点）
若前三步未覆盖（即 i <= e1 且 i <= e2），说明数组中间存在 “需要复用但位置变化” 的节点，例如：
```md
c1: [a,b, c,d,e,   f,g]  
c2: [a,b, e,c,d,h, f,g]

旧差异区[c,d,e]  
新差异区[e,c,d,h]
```
### 建立新节点的 key 映射表
先遍历新数组的差异区，用 Map 存储 “key → 新节点唯一标识”，方便快速查找老节点是否在新数组中存在：
```ts
const keyToNewIndexMap = new Map();

for (let i = s2; i <= e2; i++) { // s2 = i，新数组差异区起始
  const vnode = c2[i];
  keyToNewIndexMap.set(vnode.key, i); // 记录 key 对应的新索引
}
```

### 复用存在的节点，删除不存在的节点
遍历老数组的差异区，通过 keyToNewIndexMap 查找：
 - 若找到对应新节点：复用该节点，更新属性 / 子节点；
 - 若找不到：删除该老节点（新数组中已不存在）；
```ts
for (let i = s1; i <= e1; i++) { // s1 = i，老数组差异区起始

  const vnode = c1[i];
  // 通过老数组的标识 去查找新数组有没有相同节点
  const newIndex = keyToNewIndexMap.get(vnode.key);  

  if (!newIndex) {
    unmount(vnode); // 新数组中无此节点，删除
  }
  else {
    patch(vnode, c2[newIndex], el); // 复用节点，更新差异
  }
}
```

### 调整节点顺序（倒序插入）
最后，按照新数组的顺序，通过 “倒序插入” 调整节点位置，避免插入时影响后续节点的锚点位置，减少 DOM 操作次数
```ts
// 例如：[a,b,c,d,e,f,g]  [a,b,e,c,d,h,f,g]
// 旧差异区[c,d,e]        新差异区[e,c,d,h]


const toBePatched = e2 - s2 + 1; // 新数组差异区节点总数

for (let i = toBePatched - 1; i >= 0; i--) {

  const newIndex = s2 + i; // 新数组差异区的当前索引（倒序）  例如 h
  const anchor = c2[newIndex + 1]?.el; // 插入锚点（下一个节点）   例如 f
  const vnode = c2[newIndex];

  if (!vnode.el) {
    patch(null, vnode, el, anchor); // 新增节点（旧差异区没有的）  例如 h
  } 
  else {
    hostInsert(vnode.el, el, anchor); // 移动已有节点到正确位置（旧差异区有的）
  }
}
```