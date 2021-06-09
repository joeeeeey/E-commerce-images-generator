- 自动创建多级目录
- 将 source 图片输出为白底图 | 1:1 白底图

### Run
node index.js

## 如何使用
- 商品名称不能出现 '-', '*', 都是饿了么保留字
- 将商品录入 new.json 中
- 获取图片，图片命名为 ${商品名}-ec${图片顺序}

### TODO
- 分析商品竞争力，附近竞争水平

获得某个位置附近的美团商家 https://bj.meituan.com/s/%E7%81%AB%E9%94%85/
API 获得该商家的菜品 https://www.meituan.com/meishi/1813845875/
参考: https://zhuanlan.zhihu.com/p/159919955
分析菜品的售价和购买次数

总购买次数为需求，售价分析为竞争力.