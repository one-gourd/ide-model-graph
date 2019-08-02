## 概览

ide-model-graph

## 安装使用

npm 包方式：
```shell
npm install --save ide-model-graph
```

web 方式：
```html
<script src="https://unpkg.com/ide-model-graph@0.1.0/dist/index.umd.js"></script>
```
引入之后将会暴露全局变量 `ideModelGraph`.

> 如果你想要在 webpack 中 external 该库，可以使用以下配置：
```js
{
    externals: {
        "ide-model-graph": {
            "commonjs": "ide-model-graph",
            "commonjs2": "ide-model-graph",
            "amd": "ide-model-graph",
            "root": "ideModelGraph"
        }
    }
}
```

## 注意

### graph.addEdge
在图操作的时候，因mst限制，通过 `graph._addEdgeByEdge` 添加边并不会将原 vertex 添加到 graph 中（因为 edge 只提供 id 信息）；

因此在模型里，建议先添加节点、再添加边 —— 不然可能添加的节点（ID虽然是一样）是新创建的；

如果想要通过添加边的同时，也将节点添加到模型中，需要使用 `graph.addEdge`

## 如何本地开发？

### 本地调试

首先从 git 仓库拉取代码，安装依赖项：
```shell
git clone https://github.com/one-gourd/ide-model-graph.git

npm install

## 安装 peerDependencies 依赖包
npm run install:all
```

运行以下命令后，访问 demo 地址： http://localhost:9000
```shell
npm run dev
```

也可访问 [storybook](https://github.com/storybooks/storybook) 参考具体的使用案例：http://localhost:9001/
```shell
npm run storybook
```

### 运行测试用例

使用 [jest](https://jestjs.io) 进行测试，执行：

```shell
npm test
```

### 打包发布

普通的 npm 发布即可，记得发布前需要手动打包：

```shell
npm run build && npm publish
```


