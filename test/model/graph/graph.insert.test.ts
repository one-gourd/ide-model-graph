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

describe('Graph [insertAfterVertex] - 新增节点', () => {
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

  it('在首个节点后新增节点', () => {
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C']);

    let edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_C']));

    graph.insertAfterVertex(vertexD, vertexA, 3);
    edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_D', 'D_B', 'B_C']));
    expect(graph.edgeLinkedList).toEqual(['A', 'D', 'B', 'C']);
    expect(graph.weight).toBe(6);
  });

  it('在最后节点后新增节点', () => {
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C']);

    let edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_C']));

    graph.insertAfterVertex(vertexD, vertexC, 7);
    edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_C', 'C_D']));
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C', 'D']);
    expect(graph.weight).toBe(10);
  });
});

describe('Graph [insertAfterVertex] - 交换节点', () => {
  let graph: IGraphModel,
    vertexA: IVertexModel,
    vertexB: IVertexModel,
    vertexC: IVertexModel,
    vertexD: IVertexModel,
    edges: IEdgeModel[];

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
      .addEdge({ start: vertexC, end: vertexD, weight: 3 });

    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C', 'D']);

    edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_C', 'C_D']));
  });

  it('交换 B->C 节点', () => {

    // 先把 B 节点从图中取出来
    let removed = graph.deleteVertexAndAutoLink(vertexB);
    graph.insertAfterVertex(removed, vertexC);
    edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_C', 'C_B', 'B_D']));
    expect(graph.edgeLinkedList).toEqual(['A', 'C', 'B', 'D']);
    expect(graph.weight).toBe(3);
  });

  it('交换 C->B 节点', () => {

    // 先把 B 节点从图中取出来
    let removed = graph.deleteVertexAndAutoLink(vertexC);
    graph.insertAfterVertex(removed, vertexA);
    edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_C', 'C_B', 'B_D']));
    expect(graph.edgeLinkedList).toEqual(['A', 'C', 'B', 'D']);
    expect(graph.weight).toBe(1);
  });

  it('交换 C->D 节点', () => {
    // 先把 B 节点从图中取出来
    let removed = graph.deleteVertexAndAutoLink(vertexC);
    graph.insertAfterVertex(removed, vertexD);
    edges = graph.allEdges.map((edge: IEdgeModel) => edge.id);
    expect(edges).toEqual(expect.arrayContaining(['A_B', 'B_D', 'D_C']));
    expect(graph.edgeLinkedList).toEqual(['A', 'B', 'D', 'C']);
    expect(graph.weight).toBe(1);
  });
});
