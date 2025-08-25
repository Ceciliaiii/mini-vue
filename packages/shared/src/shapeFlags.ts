export enum ShapeFlags {
    // 或运算：自己的类型 + 儿子的类型 = shapeFlags
    // 与运算：shapeFlags & 任意类型值，结果大于0，说明包含这个类型
    // 对元素形状的判断
  ELEMENT = 1,   // 1
  FUNCTIONAL_COMPONENT = 1 << 1,   // 2
  STATEFUL_COMPONENT = 1 << 2,   // 4
  TEXT_CHILDREN = 1 << 3,   // 8
  ARRAY_CHILDREN = 1 << 4,   // 16
  SLOTS_CHILDREN = 1 << 5,   // 32
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}