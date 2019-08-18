import {
  EdgeModel,
  VertexModel,
  GraphModel,
  IGraphModelSnapshot,
  IVertexModelSnapshot,
  IGraphModel,
  IVertexModel,
  IEdgeModel
} from '../../../src';

describe('Graph [deleteVertex] - 删除操作', () => {
  let graph: IGraphModel,
    vertexA: IVertexModel,
    vertexB: IVertexModel,
    vertexC: IVertexModel,
    vertexD: IVertexModel;

  beforeEach(() => {
    graph = GraphModel.create({
      id: 'G',
      isDirected: true
    });

    vertexA = VertexModel.create({
      id: 'A'
    });
    vertexB = VertexModel.create({
      id: 'B'
    });
    vertexC = VertexModel.create({
      id: 'C'
    });
    vertexD = VertexModel.create({
      id: 'D'
    });
    graph
      .addEdge({ start: vertexA, end: vertexB, weight: 1 })
      .addEdge({ start: vertexB, end: vertexC, weight: 2 })
      .addEdge({ start: vertexC, end: vertexD, weight: 3 })
      .addEdge({ start: vertexA, end: vertexD, weight: 4 });
  });

  it('支持在有向图中删除指定节点 - 1', () => {
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C', 'D']);
    // 无向图相当于新增 2 倍有向边
    expect(graph.allEdges.length).toBe(4);
    let removed = graph.deleteVertex(vertexA);
    expect(removed.id).toBe('A');
    expect(graph.allEdges.length).toBe(2);
    expect(graph.edgeLinkedList).toEqual(['B', 'C', 'D']);

    removed = graph.deleteVertex(vertexB);
    expect(removed.id).toBe('B');
    expect(graph.allEdges.length).toBe(1);
    expect(graph.edgeLinkedList).toEqual(['C', 'D']);
  });

  it('支持在有向图中删除指定节点 - 2', () => {
    expect(graph.allEdges.length).toBe(4);
    let removed = graph.deleteVertex(vertexB);
    expect(removed.id).toBe('B');
    expect(graph.allEdges.length).toBe(2);
    expect(graph.edgeLinkedList).toEqual(['A', 'D']);

    removed = graph.deleteVertex(vertexA);
    expect(removed.id).toBe('A');
    expect(graph.allEdges.length).toBe(1);
    expect(graph.edgeLinkedList).toEqual(['C', 'D']);
  });
});

describe('Graph [deleteVertexAndAutoLink] - 删除后自动补全', () => {
  let graph: IGraphModel,
    vertexA: IVertexModel,
    vertexB: IVertexModel,
    vertexC: IVertexModel,
    vertexD: IVertexModel;

  beforeEach(() => {
    graph = GraphModel.create({
      id: 'G',
      isDirected: true
    });

    vertexA = VertexModel.create({
      id: 'A'
    });
    vertexB = VertexModel.create({
      id: 'B'
    });
    vertexC = VertexModel.create({
      id: 'C'
    });
    vertexD = VertexModel.create({
      id: 'D'
    });
    graph
      .addEdge({ start: vertexA, end: vertexB, weight: 1 })
      .addEdge({ start: vertexB, end: vertexC, weight: 2 })
      .addEdge({ start: vertexC, end: vertexD, weight: 3 })
      .addEdge({ start: vertexA, end: vertexD, weight: 4 });
  });

  it('删除后自动补全链接 - 1', () => {
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C', 'D']);
    // 无向图相当于新增 2 倍有向边
    expect(graph.allEdges.length).toBe(4);
    let removed = graph.deleteVertexAndAutoLink(vertexA);
    expect(removed.id).toBe('A');

    const edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['B_C', 'C_D']));
    expect(graph.edgeLinkedList).toEqual(['B', 'C', 'D']);
  });

  it('删除后自动补全链接 - 2', () => {
    let removed = graph.deleteVertexAndAutoLink(vertexC);
    expect(removed.id).toBe('C');
    const edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'A_D', 'B_D']));
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'D']);
  });

  it('删除后自动补全链接 - 3', () => {
    let removed = graph.deleteVertexAndAutoLink(vertexB);
    expect(removed.id).toBe('B');
    const edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_C', 'A_D', 'C_D']));
    expect(graph.edgeLinkedList).toEqual(['A', 'D']);
  });

  it('删除后自动补全链接 - 4', () => {
    let removed = graph.deleteVertexAndAutoLink(vertexD);
    expect(removed.id).toBe('D');
    const edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_C']));
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C']);
  });
});

describe('Graph [deleteVertexAndAutoLink] - 删除后自动补全 - 边界', () => {
  let graph: IGraphModel,
    vertexA: IVertexModel,
    vertexB: IVertexModel,
    vertexC: IVertexModel,
    vertexD: IVertexModel;

  beforeEach(() => {
    graph = GraphModel.create({
      id: 'G',
      isDirected: true
    });

    vertexA = VertexModel.create({
      id: 'A'
    });
    vertexB = VertexModel.create({
      id: 'B'
    });
    vertexC = VertexModel.create({
      id: 'C'
    });
    vertexD = VertexModel.create({
      id: 'D'
    });
    graph
      .addEdge({ start: vertexA, end: vertexB, weight: 1 })
      .addEdge({ start: vertexB, end: vertexC, weight: 2 });
  });

  it('删除独立的 D 节点', () => {
    graph.addVertex(vertexD);
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C']);
    // 无向图相当于新增 2 倍有向边
    expect(graph.allEdges.length).toBe(2);
    let removed = graph.deleteVertexAndAutoLink(vertexD);
    expect(removed.id).toBe('D');

    const edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_C']));
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C']);
  });
});
