// 定义节点前缀
export enum PREFIX {
  VERTEX = 'V_',
  EDGE = 'E_',
  VJOINT = '_', //两个节点连接成边的连接符
  GRAPH = 'G_'
}


// 默认是返回当前 id 数值
export const DEFAULT_ID_CLONER = function (id: string) {
  return id;
};
export const DEFAULT_META_CLONER = function (meta: any, id:string) {
  return meta;
};

export interface ICloneFns {
  cloneId?: typeof DEFAULT_ID_CLONER;
  cloneMeta?: typeof DEFAULT_META_CLONER;
}