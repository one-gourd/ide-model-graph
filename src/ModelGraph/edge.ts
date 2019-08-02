import {
  getSnapshot,
  detach,
  types,
  Instance,
  IAnyModelType,
  SnapshotOrInstance
} from 'mobx-state-tree';

import { quickInitModel, JSONModel, EMPTY_JSON_SNAPSHOT } from 'ide-model-utils';

import { PREFIX } from './constant';
import { VertexModel, NULL_VERTEX_ID } from './vertex';

import { invariant } from 'ide-lib-utils';

import { debugModel } from '../lib/debug';

/**
 * edge model
 */
export const EdgeModel: IAnyModelType = quickInitModel('EdgeModel', {

  // edge meta 信息
  meta: types.optional(JSONModel, EMPTY_JSON_SNAPSHOT),

  // 开始节点对象，防止后续和边循环引用，需要只接收字符串
  startVid: types.optional(types.string, NULL_VERTEX_ID),

  // 结束节点对象，必须提供默认空节点，不然 detach 会报错
  endVid: types.optional(types.string, NULL_VERTEX_ID),

  // edge weight
  weight: types.optional(types.number, 0)
}).views(self => {
  return {
    get id(){
      return `${self.startVid}${PREFIX.VJOINT}${self.endVid}`
    }
  }
}).views(self=>{
  return {
    // key 以 `E_` 作为前缀
    get key(){
      return `${PREFIX.EDGE}${self.id}`
    }
  }
}).actions(self=>{
  return {
    /**
     * 翻转这条边的指向
     * 这里需要注意，需要先 detach 之后，再进行赋值更换
     * @returns
     */
    reverse() {
      const tmp = self.startVid;
      self.startVid = self.endVid;
      self.endVid = tmp;
      return self;
    }
  }
});

export interface IEdgeModel extends Instance<typeof EdgeModel> {}
export interface IEdgeModelSnapshot
  extends SnapshotOrInstance<typeof EdgeModel> {}
