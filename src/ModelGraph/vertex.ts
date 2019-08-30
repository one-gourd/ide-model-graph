import {
  getSnapshot,
  types,
  Instance,
  IAnyModelType,
  SnapshotOrInstance,
  detach,
  clone
} from 'mobx-state-tree';

import {
  quickInitModel,
  JSONModel,
  EMPTY_JSON_SNAPSHOT
} from 'ide-model-utils';

import { EdgeModel, IEdgeModel, IEdgeModelSnapshot } from './edge';
import { invariant } from 'ide-lib-utils';
import { PREFIX, ICloneFns, DEFAULT_ID_CLONER, DEFAULT_META_CLONER } from './constant';


/**
 * 节点 model
 */
export const VertexModel: IAnyModelType = quickInitModel('VertexModel', {
  // 规定每个节点 id
  id: types.identifier,

  // 节点 meta 信息：比如： {name, icon}
  meta: types.optional(JSONModel, EMPTY_JSON_SNAPSHOT),

  // 当前节点的边
  edges: types.array(types.late((): IAnyModelType => EdgeModel))
})
  .views(self => {
    return {
      // 必须要以 `V_` 作为前缀
      get key() {
        return `${PREFIX.VERTEX}${self.id}`;
      },
      /**
       * 获取 degree 数值
       *
       */
      get degree() {
        return this.edges.length;
      },

      /**
       * 获取所有邻接节点 id
       * 因为是通过 edge 来定位的，然而在 mst 中只能通过 id
       */
      get neighborIds() {
        const edges = self.edges;
        return edges.map((edge: IEdgeModel) => {
          return edge.startVid === self.id ? edge.endVid : edge.startVid;
        });
      }
    };
  })
  .views(self => {
    return {
      /**
       * 根据边 id 找到指定的边模型
       *
       * @param {string} id - id
       * @returns
       */
      findEdgeById(id: string) {
        return self.edges.find((t: IEdgeModel) => t.id === id) || null;
      },

      /**
       * 根据指定 节点 找到指定的边模型
       * 需要开始节点或结束节点匹配即可
       *
       * @param {IVertexModelSnapshot} vertex - 节点类型
       * @returns
       */
      findEdgeByVertex(vertex: IVertexModelSnapshot) {
        return (
          self.edges.find(
            (t: IEdgeModel) =>
              t.startVid === vertex.id || t.endVid === vertex.id
          ) || null
        );
      },

      /**
       * 根据指定 节点 id 找到指定的边模型
       * 需要开始节点或结束节点匹配即可
       *
       * @param {IVertexModelSnapshot} vertex - 节点类型
       * @returns
       */
      findEdgeByVid(vid: string) {
        return (
          self.edges.find(
            (t: IEdgeModel) => t.startVid === vid || t.endVid === vid
          ) || null
        );
      },

      /**
       * 根据边 找到指定的边模型；
       * 需要开始节点和结束节点完全匹配
       *
       * @param {IEdgeModelSnapshot} edge
       * @returns
       */
      findEdge(edge: IEdgeModelSnapshot) {
        return (
          self.edges.find(
            (t: IEdgeModel) =>
              t.startVid === edge.startVid && t.endVid === edge.endVid
          ) || null
        );
      }
    };
  })
  .views(self => {
    return {
      /**
       * 判断某条边是否存在于当前节点上（通过 id）
       *
       * @param {IEdgeModelSnapshot} edge
       * @returns {boolean}
       */
      hasEdge(edge: IEdgeModelSnapshot): boolean {
        const edgeNode = self.findEdgeById(edge.id);
        return !!edgeNode;
      },

      /**
       * 判断某个节点是否是和当前节点连接（通过比对节点 id 实现）
       *
       * @param {IVertexModelSnapshot} vertex
       * @returns {boolean}
       */
      hasNeighbor(vertex: IVertexModelSnapshot): boolean {
        const vertexNode = this.edges.find(
          (edge: IEdgeModel) =>
            edge.startVid === vertex.id || edge.endVid === vertex.id
        );
        return !!vertexNode;
      }
    };
  })
  .actions(self => {
    return {
      /**
       * 克隆当前节点，需要保证 id 不一样
       * 通过传入指定函数可以操作该节点的 meta 信息（诸如修改节点名字等副作用操作）
       * @param {ICloneFns} [verteCloneFns={}] - 克隆 vertex 的配置项
       */
      clone(verteCloneFns: ICloneFns = {}) {
        const {
          cloneId = DEFAULT_ID_CLONER,
          cloneMeta = DEFAULT_META_CLONER
        } = verteCloneFns;

        invariant(!!cloneId, '[vertex] 缺少 id clone 方法');
        invariant(!!cloneMeta, '[vertex] 缺少 meta clone 方法');

        // 先创建新的 vertex，使用 cloneId 方法生成新 id
        const clonedVertex = VertexModel.create({
          id: cloneId(self.id)
        });

        // 同时调用 cloneMeta 生成新 meta，注意为了防止修改原 meta，这里需要 assign
        clonedVertex.setMeta(cloneMeta(Object.assign({}, self.meta), self.id));

        // 同时需要挨个遍历 edges 集合，修改其中节点原 id 为现 id
        const newEdges = self.edges.map((edge: IEdgeModel) => {
          const clonedEdge = clone(edge);

          if (clonedEdge.startVid == self.id) {
            clonedEdge.setStartVid(clonedVertex.id);
          }
          if (clonedEdge.endVid == self.id) {
            clonedEdge.setEndVid(clonedVertex.id);
          }

          return clonedEdge;
        });

        // 将 edge 挂载到 cloneVertex 上
        clonedVertex.setEdges(newEdges);

        return clonedVertex;
      },

      /**
       * 将 edge 添加到当前节点的边链表中
       *
       * @param {IEdgeModelSnapshot} edge - edge 实例
       * @returns
       */
      addEdge(edge: IEdgeModelSnapshot) {
        self.edges.push(edge);
        return self;
      },

      /**
       * 将 edge 从当前节点的边链表中删除
       * 先找到指定的边，然后 detach 掉
       *
       * @param {IEdgeModelSnapshot} edge - edge 实例
       */
      deleteEdge(edge: IEdgeModelSnapshot) {
        const target = self.findEdge(edge);
        return target ? detach(target) : null;
      }
    };
  })
  .actions(self => {
    return {
      /**
       * 删除当前节点所有的边
       *
       */
      deleteAllEdges() {
        return detach(self.edges);
      }
    };
  });

export interface IVertexModel extends Instance<typeof VertexModel> {}
export interface IVertexModelSnapshot
  extends SnapshotOrInstance<typeof VertexModel> {}

// 创建 NULL 节点
export const NULL_VERTEX_ID = `${PREFIX.VERTEX}NULL`;
