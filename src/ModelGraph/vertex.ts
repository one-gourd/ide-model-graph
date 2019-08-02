import {
  getSnapshot,
  types,
  Instance,
  IAnyModelType,
  SnapshotOrInstance,
  detach
} from 'mobx-state-tree';

import { quickInitModel, JSONModel, EMPTY_JSON_SNAPSHOT } from 'ide-model-utils';


import { PREFIX } from './constant';
import { EdgeModel, IEdgeModel, IEdgeModelSnapshot } from './edge';

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
}).views(self => {
  return {

   // 必须要以 `V_` 作为前缀
  get key() {
      return `${PREFIX.VERTEX}${self.id}`
  },
  /**
   * 获取 degree 数值
   *
   */
    get degree(){
      return this.edges.length;
    },

  /**
   * 获取所有邻接节点 id
   * 因为是通过 edge 来定位的，然而在 mst 中只能通过 id
   */
    get neighborIds() {
      const edges = self.edges;
      return edges.map((edge: IEdgeModel) => {
        return edge.startVid === self.id
          ? edge.endVid
          : edge.startVid;
      });
    }
  };
}).views(self => {
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
      return self.edges.find((t: IEdgeModel) => t.startVid === vertex.id || t.endVid === vertex.id) || null;
    },

  /**
   * 根据指定 节点 id 找到指定的边模型
   * 需要开始节点或结束节点匹配即可
   *
   * @param {IVertexModelSnapshot} vertex - 节点类型
   * @returns
   */
    findEdgeByVid(vid: string) {
      return self.edges.find((t: IEdgeModel) => t.startVid === vid || t.endVid === vid) || null;
    },


    /**
     * 根据边 找到指定的边模型；
     * 需要开始节点和结束节点完全匹配
     *
     * @param {IEdgeModelSnapshot} edge
     * @returns
     */
    findEdge(edge: IEdgeModelSnapshot) {
      return self.edges.find((t: IEdgeModel) => t.startVid === edge.startVid && t.endVid === edge.endVid) || null;
    }
  };
}).views(self=>{
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
        const vertexNode = this.edges.find((edge: IEdgeModel) => edge.startVid === vertex.id || edge.endVid === vertex.id);
      return !!vertexNode;
    }

  }
}).actions(self=>{
  return {

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
  }
}).actions(self=>{
  return {
    /**
     * 删除当前节点所有的边
     *
     */
    deleteAllEdges() {
      return detach(self.edges);;
    }

  }
});

export interface IVertexModel extends Instance<typeof VertexModel> {}
export interface IVertexModelSnapshot
  extends SnapshotOrInstance<typeof VertexModel> {}

// 创建 NULL 节点
export const NULL_VERTEX_ID = `${PREFIX.VERTEX}NULL`;
