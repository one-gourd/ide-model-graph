import {
    clone,
    types,
    Instance,
    IAnyModelType,
    SnapshotOrInstance,
    detach
} from 'mobx-state-tree';

import { invariant } from 'ide-lib-utils';
import { quickInitModel, JSONModel, EMPTY_JSON_SNAPSHOT } from 'ide-model-utils';

import { PREFIX } from './constant';
import { EdgeModel, IEdgeModel, IEdgeModelSnapshot } from './edge';
import { VertexModel, IVertexModel, IVertexModelSnapshot, NULL_VERTEX_ID } from './vertex';


/**
 * graph model
 */
export const GraphModel: IAnyModelType = quickInitModel('GraphModel', {
    // 规定每个图都有 id 
    id: types.identifier,

    // edge meta 信息
    meta: types.optional(JSONModel, EMPTY_JSON_SNAPSHOT),

    // 是否是有向图
    isDirected: types.optional(types.boolean, false),

    // 节点集合
    vertices: types.map(VertexModel),

}).views(self => {
    return {
        // key 以 `G_` 作为前缀
        get key() {
            return `${PREFIX.GRAPH}${self.id}`
        },
        // 返回途中所有节点列表
        get allVertices() {
            return Array.from(self.vertices.values());
        },

        // 边集合，因为边已经存在节点中，所以可以从节点集合中获取边集合
        get edges() {
            const edgeMap = new Map<string, IEdgeModel>();
            self.vertices.forEach((vertex: IVertexModel) => {
                vertex.edges.forEach((edge: IEdgeModel) => {
                    edgeMap.set(edge.id, edge);
                });
            });

            return edgeMap;
        }, 

        // 返回图所有边列表
        get allEdges(){
            const edgeArray: IVertexModel[]  = [];
            self.vertices.forEach((vertex: IVertexModel) => {
                vertex.edges.forEach((edge: IEdgeModel) => {
                    edgeArray.push(edge);
                });
            });
            return edgeArray;
        }
    }
}).views(self => {
    return {

        /**
         * 返回图中所有边的权重之和
         */
        get weight() {
            return self.allEdges.reduce((weight: number, graphEdge: IEdgeModel) => {
                return weight + graphEdge.weight;
            }, 0);
        },
        /**
          * 返回“节点 - 索引”映射表
          *
          * @returns {{ [key: string]: number }} - 映射表对象
          */
        get verticesIndices(): { [key: string]: number } {
            const verticesIndices: { [key: string]: number } = {}
            self.allVertices.forEach((vertex: IVertexModel, index: number) => {
                verticesIndices[vertex.id] = index;
            });

            return verticesIndices;
        },

        /**
         * 重写 toString 方法，打印出图论中的有关图的定义 G=(V，E)
         * @return {string}
         */
        toString(){
            return JSON.stringify({
                V: this.allVertices.map((o: IVertexModel)=>o.id).toString(),
                E: this.allEdges.map((o:IEdgeModel)=>o.id).toString()
            })
        },

        /**
         * 根据 id 值返回指定节点
         *
         * @param {string} vId
         * @returns
         */
        getVertexById(vId: string) {
            return self.vertices.get(vId);
        },

        /**
         * 返回指定节点的相邻节点 id 集合
         * 
         * @param {IVertexModelSnapshot} vertex
         * @returns {string[]}
         */
        getNeighborIds(vertex: IVertexModelSnapshot): string[] {
            return vertex.neighborIds;
        },

        /**
         * 返回指定节点的相邻节点集合
         * 
         * @param {IVertexModelSnapshot} vertex
         * @returns {string[]}
         */
        getNeighbors(vertex: IVertexModelSnapshot): IVertexModel[] {
            return vertex.neighborIds.reduce((result: string[], id:string)=>{
                const neighbor = self.vertices.get(id);
                if (!!neighbor) {
                    result.push(neighbor);
                }
                return result;
            }, []);
        }


    }
}).views(self=>{
    return {

        /**
         * 根据开始、结束节点的 id 查找边
         *
         * @param {string} startVid - 开始节点 id
         * @param {string} endVid - 结束节点 id
         * @returns
         */
        findEdgeById(startVid: string, endVid: string) {

            // 首先判断开始节点是否在图中
            const vertex = self.getVertexById(startVid);

            if (!vertex) {
                return null;
            }

            // 然后通过开始节点 - 结束节点对应的边的实例
            return vertex.findEdgeByVid(endVid);
        }
    }
}).actions(self => {
    return {

        /**
         * 添加节点
         *
         * @param {IVertexModelSnapshot} newVertex
         * @returns
         */
        addVertex(newVertex: IVertexModelSnapshot) {
            self.vertices.set(newVertex.id, newVertex);
            return self;
        },


        /**
         * 给图中添加边
         * 注：因mst限制，通过 `graph._addEdgeByEdge` 添加边并不会将原 vertex 添加到 graph 中（因为 edge 只提供 id 信息）；
         * 因此在模型里，建议先添加节点、再添加边 —— 不然可能添加的节点（ID虽然是一样）是新创建的；
         * 
         * 建议改函数只在内部使用，外部推荐使用 `graph.addEdge`
         * 
         * @param {IEdgeModelSnapshot} edge - 待添加的边
         * @param {boolean} [disableErrorWhenExist=false] - 是否关闭错误提示（当边已经存在图中的时候），默认是有错误提示
         * @returns
         */
        _addEdgeByEdge(edge: IEdgeModelSnapshot, disableErrorWhenExist = false) {

            // 判断边是否已经添加到图中
            if (self.edges.get(edge.id)) {
                if (disableErrorWhenExist) {
                    return self;
                } else {
                    invariant(false, `Edge ${edge.id} has already been added before`);
                }
            }

            // 首先找到开始和结束节点
            let startVertex = self.getVertexById(edge.startVid);
            let endVertex = self.getVertexById(edge.endVid);

            // 如果开始节点不存在图中，需要先添加
            if (!startVertex) {
                self.addVertex(VertexModel.create({ id: edge.startVid}));
                startVertex = self.getVertexById(edge.startVid); // 注意：需要重新获取一次，不然 startVertex 不存在
            }

            // 如果结束节点不存在图中，需要先添加
            if (!endVertex) {
                self.addVertex(VertexModel.create({ id: edge.endVid }));
                endVertex = self.getVertexById(edge.endVid); // 注意：需要重新获取一次，不然 endVertex 不存在
            }

            // 根据是否是双向图
            if (self.isDirected) { // 如果是有向图，那么只用给 startVertex 添加此边
                startVertex.addEdge(edge)
            } else { // 否则就给开始节点、结束节点都添加方向节点
                startVertex.addEdge(edge);

                // 给结束节点添加需要先克隆一份，然后再反向，最后才能添加
                const clonedEdge = clone(edge);
                clonedEdge.reverse();
                endVertex.addEdge(clonedEdge);
            }

            return self;
        },


        /**
         * 删除图中的某条边
         *
         * @param {IEdgeModelSnapshot} edge - 边的实例
         * @param {boolean} [disableErrorWhenExist=false] - 是否关闭错误提示（当图中不存在边时），默认是有错误提示
         * @returns
         */
        deleteEdge(edge: IEdgeModelSnapshot, disableErrorWhenExist = false){
            // 判断边是否存在
            if (!self.edges.get(edge.id)) {
                if (disableErrorWhenExist) {
                    return self;
                } else {
                    invariant(false, `Edge ${edge.id} not found in graph`);
                }
            }

            // 同时找到该边所在开始节点和结束节点
            const startVertex = self.getVertexById(edge.startVid);
            const endVertex = self.getVertexById(edge.endVid);

            // 先删除开始节点上的该
            startVertex.deleteEdge(edge);

            // 如果是无向图，还需要删除反向边
            if(!self.isDirected) {
                endVertex.deleteEdge({startVid: edge.endVid, endVid: edge.startVid});
            }
           
            return self;
        },
    }
}).views(self => {
    return {

        /**
        * 根据开始、结束节点查找边
        *
        * @param {IVertexModelSnapshot} startVertex - 开始节点
        * @param {
        IVertexModelSnapshot
    } endVertex - 结束节点
        * @returns
        */
        findEdge(startVertex: IVertexModelSnapshot, endVertex: IVertexModelSnapshot) {
            return self.findEdgeById(startVertex.id, endVertex.id);
        },

        /**
         * 生成邻接矩阵
         * 
         * @returns {number[][]}
         */
        get adjacencyMatrix(): number[][] {
            // 获取所有的节点列表
            const vertices = self.allVertices;
            // 获取节点索引映射表
            const verticesIndices = self.verticesIndices;

            // 初始化邻接矩阵，赋值 `Infinity` 表示两点之间不可达
            // 邻接矩阵是 N x N 大小的
            const adjacencyMatrix = Array(vertices.length).fill(null).map(() => {
                return Array(vertices.length).fill(Infinity);
            });

            // 给每一列赋值
            vertices.forEach((vertex: IVertexModel, vertexIndex: number) => {
                vertex.neighborIds.forEach((neighborId: number) => {
                    const neighborIndex = verticesIndices[neighborId];
                    const edge = self.findEdgeById(vertex.id, neighborId);
                    if (!!edge) {
                        adjacencyMatrix[vertexIndex][neighborIndex] = edge.weight;
                    }

                });
            });

            return adjacencyMatrix;
        }
    }
}).actions(self=> {
    return {
        /**
        * 同时添加节点和边，是对 `graph._addEdgeByEdge` 的增强
        * 外部想要给图新增边，建议调用该函数，而非 `graph._addEdgeByEdge`
        *
        * @param {{ start: IVertexModelSnapshot, end: IVertexModelSnapshot}} edge
        * @param {boolean} [disableErrorWhenExist=false]
        */
        addEdge(edge: { start: IVertexModelSnapshot, end: IVertexModelSnapshot, weight?: number}, disableErrorWhenExist = false) {
            const {start, end, weight} = edge;
            const edgeModel = EdgeModel.create({
                startVid: start.id,
                endVid: end.id,
                weight: weight || 0
            })
            // 判断边是否已经添加到图中
            if (self.edges.get(edgeModel.id)) {
                if (disableErrorWhenExist) {
                    return self;
                } else {
                    invariant(false, `Edge ${edgeModel.id} has already been added before`);
                }
            }

            // 先添加节点
            self.addVertex(start);
            self.addVertex(end);

            // 然后通过添加边
            self._addEdgeByEdge(edgeModel);

            return self;
        },

        /**
         * 让图中所有的边都反向
         *
         * @returns {IGraphModel}
         */
        reverse(): IGraphModel {
            // 遍历所有的边
            self.allEdges.forEach((edge: IEdgeModel) => {
                // 先将边从图中删除（反向操作之前一定要删除边，不然数据会存在不一致性 -  key 没有反向，而 self.edges[key] 反向了 ）

                const clonedEdge = clone(edge);
                self.deleteEdge(edge);

                // 然后将边进行反向操作
                clonedEdge.reverse();

                console.log(444, clonedEdge.toJSON());
                // 再将边添加回图中
                self._addEdgeByEdge(clonedEdge);
            });
            return self;
        },


    }
});

export interface IGraphModel extends Instance<typeof GraphModel> { }
export interface IGraphModelSnapshot
    extends SnapshotOrInstance<typeof GraphModel> { }