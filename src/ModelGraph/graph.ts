import {
  clone,
  types,
  Instance,
  IAnyModelType,
  SnapshotOrInstance,
  detach
} from 'mobx-state-tree';

import { invariant } from 'ide-lib-utils';
import {
  quickInitModel,
  JSONModel,
  EMPTY_JSON_SNAPSHOT
} from 'ide-model-utils';

import { PREFIX } from './constant';
import { EdgeModel, IEdgeModel, IEdgeModelSnapshot } from './edge';
import {
  VertexModel,
  IVertexModel,
  IVertexModelSnapshot,
  NULL_VERTEX_ID
} from './vertex';

const MAX_COUNT_ITERATOR = 500; // 最大

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
  vertices: types.map(VertexModel)
})
  .views(self => {
    return {
      // key 以 `G_` 作为前缀
      get key() {
        return `${PREFIX.GRAPH}${self.id}`;
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

      // 建立 开始节点 - 边 索引
      get starterToEdgeIndexes() {
        const starterToEdgeIndexes = new Map<string, IEdgeModel>();
        self.vertices.forEach((vertex: IVertexModel) => {
          vertex.edges.forEach((edge: IEdgeModel) => {
            // 如果节点节点已经存在
            const startVid = edge.startVid;
            const currentEdges = starterToEdgeIndexes.get(startVid) || [];
            starterToEdgeIndexes.set(startVid, currentEdges.concat(edge));
          });
        });
        return starterToEdgeIndexes;
      },

      // 建立 结束节点 - 边 索引
      get enderToEdgeIndexes() {
        const enderToEdgeIndexes = new Map<string, IEdgeModel>();
        self.vertices.forEach((vertex: IVertexModel) => {
          vertex.edges.forEach((edge: IEdgeModel) => {
            const endVid = edge.endVid;
            const currentEdges = enderToEdgeIndexes.get(endVid) || [];
            enderToEdgeIndexes.set(endVid, currentEdges.concat(edge));
          });
        });
        return enderToEdgeIndexes;
      },

      // 返回图所有边列表
      get allEdges() {
        const edgeArray: IVertexModel[] = [];
        self.vertices.forEach((vertex: IVertexModel) => {
          vertex.edges.forEach((edge: IEdgeModel) => {
            edgeArray.push(edge);
          });
        });
        return edgeArray;
      },

      /**
       * 根据 id 值返回指定节点
       *
       * @param {string} vId
       * @returns
       */
      getVertexById(vId: string) {
        return self.vertices.get(vId);
      }
    };
  })
  .views(self => {
    return {
      // 获取某个节点的 outer 边（即从该节点往外指向的边）
      getOutEdgesById(vid: string): IEdgeModel[] {
        const starterToEdgeIndexes = self.starterToEdgeIndexes;
        return starterToEdgeIndexes.get(vid) || [];
      },

      // 获取某个节点的 inner 边（即从其他节点指向该节点的边）
      getInEdgesById(vid: string): IEdgeModel[] {
        const enderToEdgeIndexes = self.enderToEdgeIndexes;
        return enderToEdgeIndexes.get(vid) || [];
      },

      // 获取该节点的下一个节点列表
      getNextVertices(vid: string): IVertexModel[] {
        const starterToEdgeIndexes = self.starterToEdgeIndexes;
        return (starterToEdgeIndexes.get(vid) || []).map((edge: IEdgeModel) =>
          self.getVertexById(edge.endVid)
        );
      },

      // 获取指向该节点的节点列表
      getSourceVertices(vid: string): IVertexModel[] {
        const enderToEdgeIndexes = self.enderToEdgeIndexes;
        return (enderToEdgeIndexes.get(vid) || []).map((edge: IEdgeModel) =>
          self.getVertexById(edge.startVid)
        );
      }
    };
  })
  .views(self => {
    return {
      /**
       * 返回当前图的节点顺序表
       * 注：只能在有向图中进行此操作
       *
       * @returns
       */
      get edgeLinkedList() {
        invariant(
          self.isDirected,
          '当前是无向图，只能在有向图中获取 `edgeLinkedList` 操作'
        );

        const edges = self.allEdges;

        // 从任何一个节点开始
        const linkedList: string[] = [];
        let count = 0; // 循环计数器，防止死循环

        // 1. 先往后添加节点
        let edge = edges[0] || null;
        edge && linkedList.push(edge.startVid);

        while (edge && count < MAX_COUNT_ITERATOR) {
          count++;
          const endVid = edge.endVid;
          linkedList.push(endVid);
          edge = self.getOutEdgesById(endVid)[0] || null;
        }

        // 2. 然后再向前添加节点
        edge = (edges[0] && self.getInEdgesById(edges[0].startVid)[0]) || null;
        while (edge && count < MAX_COUNT_ITERATOR) {
          count++;
          const startVid = edge.startVid;
          linkedList.unshift(startVid);
          edge = self.getInEdgesById(startVid)[0] || null;
        }
        if (count >= MAX_COUNT_ITERATOR) {
          console.warn(
            `[edgeLinkedList] 循环次数(${count})过多，有可能存在死循环，请检查`
          );
        }

        // 边界情况，如果只有一个节点的情况
        if (!linkedList.length && !!self.allVertices.length) {
          linkedList.push(self.allVertices[0].id);
        }

        return linkedList;
      },

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
        const verticesIndices: { [key: string]: number } = {};
        self.allVertices.forEach((vertex: IVertexModel, index: number) => {
          verticesIndices[vertex.id] = index;
        });

        return verticesIndices;
      },

      /**
       * 重写 toString 方法，打印出图论中的有关图的定义 G=(V，E)
       * @return {string}
       */
      toString() {
        return JSON.stringify({
          V: this.allVertices.map((o: IVertexModel) => o.id).toString(),
          E: this.allEdges.map((o: IEdgeModel) => o.id).toString()
        });
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
        return vertex.neighborIds.reduce((result: string[], id: string) => {
          const neighbor = self.vertices.get(id);
          if (!!neighbor) {
            result.push(neighbor);
          }
          return result;
        }, []);
      }
    };
  })
  .views(self => {
    return {
      /**
       * 返回当前 graphes 的所有开始节点
       * 注意只能在有向图中进行操作
       * 开始节点的定义：没有入边的节点都可以当做开始节点
       */
      get firstVertices(): IVertexModel[] {
        invariant(!!self.isDirected, '只能在有向图中才有 “首节点” 的概念');

        const result: IVertexModel[] = [];

        // 遍历所有节点，查找他们是否在 InEdges 索引表中
        self.vertices.forEach((vertex: IVertexModel) => {
          const inEdges = self.getInEdgesById(vertex.id);
          if (!inEdges || !inEdges.length) {
            result.push(vertex);
          }
        });

        return result;
      },

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
    };
  })
  .actions(self => {
    return {
      /**
       * 直接添加节点 - 不会自动添加边
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

        // 当开始结尾节点都是 null，就不要添加
        if (
          edge.startVid === NULL_VERTEX_ID &&
          edge.endVid === NULL_VERTEX_ID
        ) {
          return self;
        }

        // 首先找到开始和结束节点
        let startVertex = self.getVertexById(edge.startVid);
        let endVertex = self.getVertexById(edge.endVid);

        // 如果开始节点不存在图中，需要先添加
        if (!startVertex) {
          self.addVertex(VertexModel.create({ id: edge.startVid }));
          startVertex = self.getVertexById(edge.startVid); // 注意：需要重新获取一次，不然 startVertex 不存在
        }

        // 如果结束节点不存在图中，需要先添加
        if (!endVertex) {
          self.addVertex(VertexModel.create({ id: edge.endVid }));
          endVertex = self.getVertexById(edge.endVid); // 注意：需要重新获取一次，不然 endVertex 不存在
        }

        // 根据是否是双向图
        if (self.isDirected) {
          // 如果是有向图，那么只用给 startVertex 添加此边
          startVertex.addEdge(edge);
        } else {
          // 否则就给开始节点、结束节点都添加方向节点
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
      deleteEdge(edge: IEdgeModelSnapshot, disableErrorWhenExist = false) {
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

        // 先删除开始节点上的边
        startVertex.deleteEdge(edge);

        // 如果是无向图，还需要删除反向边
        if (!self.isDirected) {
          endVertex.deleteEdge({
            startVid: edge.endVid,
            endVid: edge.startVid
          });
        }

        return self;
      },

      /**
       * 从当前图中删除指定节点
       *
       * @param {IVertexModelSnapshot} vertex - 目标节点
       * @param {boolean} [disableErrorWhenExist=false] - 当节点不存在的时候，是否提醒错误
       * @returns
       */
      deleteVertex(
        vertex: IVertexModelSnapshot,
        disableErrorWhenExist = false
      ) {
        // 判断边是否存在
        if (!self.vertices.get(vertex.id)) {
          if (disableErrorWhenExist) {
            return self;
          } else {
            invariant(false, `Vertex ${vertex.id} not found in graph`);
          }
        }
        // 先找到指向该节点的边（当前节点为目标点）
        const edgesReferToVertex = self.getInEdgesById(vertex.id);
        // 分别让开始节点中的边集合删除这些边
        edgesReferToVertex.forEach((edge: IVertexModel) => {
          const startVertex = self.getVertexById(edge.startVid);
          startVertex.deleteEdge(edge);
        });

        // 然后删除当前节点
        return detach(vertex);
      }
    };
  })
  .views(self => {
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
      findEdge(
        startVertex: IVertexModelSnapshot,
        endVertex: IVertexModelSnapshot
      ) {
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
        const adjacencyMatrix = Array(vertices.length)
          .fill(null)
          .map(() => {
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
    };
  })
  .actions(self => {
    return {
      /**
       * 给指定 afterVertex 后插入节点
       * 注：待插入的节点的边将被重置
       *
       * @param {IVertexModelSnapshot} vertex
       * @param {IVertexModelSnapshot} afterVertex
       */
      insertAfterVertex(
        vertex: IVertexModelSnapshot,
        afterVertex: IVertexModelSnapshot,
        weight = 0
      ) {
        invariant(vertex && vertex.id, '操作失败：源节点不存在');
        invariant(afterVertex && afterVertex.id, '操作失败：目标节点不存在');
        // 先获取所有 afterVertex 所有的外向边
        const outEdges = self.getOutEdgesById(afterVertex.id);

        // 为保持纯粹性，需要将加入的 vertex 边全部清除
        vertex.deleteAllEdges();

        // 然后挨个将这些边添加到 vertex 中
        outEdges.forEach((edge: IEdgeModel) => {
          // 删除出边
          const detachedEdge = afterVertex.deleteEdge(edge);
          if (detachedEdge) {
            //   修改其实边
            detachedEdge.setStartVid(vertex.id);
            // 添加到当前节点
            vertex.addEdge(detachedEdge);
          }
        });

        // 将节点加入到图中
        self.addVertex(vertex);

        // 然后将加入的点和 afterVertex 连接起来
        const edgeModel = EdgeModel.create({
          startVid: afterVertex.id,
          endVid: vertex.id,
          weight: weight
        });
        self._addEdgeByEdge(edgeModel);

        return self;
      },

      /**
       * 将节点插入作为图的首个节点
       *
       * @param {IVertexModelSnapshot} vertex
       * @param {number} weight
       */
      insertAsFirstVertex(vertex: IVertexModelSnapshot, weight = 0) {
        // 首先查找到当前图中的首个节点
        const firstVertices = self.firstVertices;

        // 先将 vertex 添加到图中
        self.addVertex(vertex);
        // 将节点和这些 firstVertices 进行连接
        firstVertices.forEach((firstVertex: IVertexModel) => {
          self.addEdge({ start: vertex, end: firstVertex, weight });
        });

        return self;
      },

      /**
       * 同时添加节点和边，是对 `graph._addEdgeByEdge` 的增强
       * 外部想要给图新增边，建议调用该函数，而非 `graph._addEdgeByEdge`
       *
       * @param {{ start: IVertexModelSnapshot, end: IVertexModelSnapshot}} edge
       * @param {boolean} [disableErrorWhenExist=false]
       */
      addEdge(
        edge: {
          start: IVertexModelSnapshot;
          end: IVertexModelSnapshot;
          weight?: number;
        },
        disableErrorWhenExist = false
      ) {
        const { start, end, weight } = edge;
        const edgeModel = EdgeModel.create({
          startVid: start.id,
          endVid: end.id,
          weight: weight || 0
        });
        // 判断边是否已经添加到图中
        if (self.edges.get(edgeModel.id)) {
          if (disableErrorWhenExist) {
            return self;
          } else {
            invariant(
              false,
              `Edge ${edgeModel.id} has already been added before`
            );
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

          // 再将边添加回图中
          self._addEdgeByEdge(clonedEdge);
        });
        return self;
      }
    };
  })
  .actions(self => {
    return {
      /**
       *
       *  从当前图中删除指定节点后自动关联该节点的上下游节点（相当于自动缝合当前图）
       *
       * @param {IVertexModelSnapshot} vertex - 目标节点
       * @param {boolean} [disableErrorWhenExist=false] - 当节点不存在的时候，是否提醒错误
       * @returns
       */
      deleteVertexAndAutoLink(
        vertex: IVertexModelSnapshot,
        disableErrorWhenExist = false
      ) {
        // 获取来源节点集合
        const fromVertices = self.getSourceVertices(vertex.id);

        // 获取下一节点集合
        const nextVertices = self.getNextVertices(vertex.id);

        // 执行删除操作
        const detached = self.deleteVertex(vertex);

        // 自动 link 上下游节点，新增边的权重是 0
        fromVertices.forEach((fromVertex: IVertexModel) => {
          nextVertices.forEach((nextVertex: IVertexModel) => {
            self.addEdge({ start: fromVertex, end: nextVertex });
          });
        });

        return detached;
      }
    };
  });

export interface IGraphModel extends Instance<typeof GraphModel> {}
export interface IGraphModelSnapshot
  extends SnapshotOrInstance<typeof GraphModel> {}
