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

describe('Graph [firstVertices] - 获取首节点', () => {
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

    graph.addVertex(vertexA);
    graph.addVertex(vertexB);
    graph.addVertex(vertexC);
    graph.addVertex(vertexD);
  });

  it('如果有 4 个单独节点，则有 4 个 firstVertex', () => {
    const ids = graph.firstVertices.map((v: IVertexModel) => v.id);
    expect(ids.length).toBe(4);
    expect(ids).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
  });

  it('如果有 3 个开始节点，则有 3 个 firstVertex', () => {
    graph.addEdge({ start: vertexA, end: vertexB });
    const ids = graph.firstVertices.map((v: IVertexModel) => v.id);
    expect(ids.length).toBe(3);
    expect(ids).toEqual(expect.arrayContaining(['A', 'C', 'D']));
  });

  it('如果有 2 个开始节点，则有 2 个 firstVertex', () => {
    graph.addEdge({ start: vertexA, end: vertexB });
    graph.addEdge({ start: vertexC, end: vertexD });
    const ids = graph.firstVertices.map((v: IVertexModel) => v.id);
    expect(ids.length).toBe(2);
    expect(ids).toEqual(expect.arrayContaining(['A', 'C']));
  });

  it('如果有 1 个开始节点，则有 1 个 firstVertex', () => {
    graph.addEdge({ start: vertexA, end: vertexB }).addEdge({ start: vertexB, end: vertexC }).addEdge({ start: vertexC, end: vertexD });
    const ids = graph.firstVertices.map((v: IVertexModel) => v.id);
    expect(ids.length).toBe(1);
    expect(ids).toEqual(expect.arrayContaining(['A']));
  });



});
