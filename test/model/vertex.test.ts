import { EdgeModel, VertexModel } from '../../src';
describe('Vertex - 节点', () => {
    it('根据 ID 创建出节点', () => {
        const vertex = VertexModel.create({
            id: 'A'
        });
        expect(vertex).toBeDefined();
        expect(vertex.id).toBe('A');
        expect(vertex.key).toBe('V_A');
        expect(vertex.edges).toEqual([]);
        expect(vertex.meta).toEqual({});
    });

    it('正常创建节点、添加边', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });;
        const vertexB = VertexModel.create({
            id: 'B'
        });;

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });

        vertexA.addEdge(edgeAB);

        expect(vertexA.hasEdge(edgeAB)).toBe(true);
        expect(vertexB.hasEdge(edgeAB)).toBe(false);
        expect(vertexA.edges.length).toBe(1);
        expect(vertexA.edges[0].id).toBe('A_B');
        expect(vertexA.edges[0].key).toBe('E_A_B');
    });

    it('正常可以从节点上新增、删除边', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        const vertexC = VertexModel.create({
            id: 'C'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        });

        vertexA.addEdge(edgeAB).addEdge(edgeAC);

        // 注意，这是有向图的，存在 AB 边并不等于存在 BA 边
        expect(vertexA.hasEdge(edgeAB)).toBe(true);
        expect(vertexB.hasEdge(edgeAB)).toBe(false);

        expect(vertexA.hasEdge(edgeAC)).toBe(true);
        expect(vertexC.hasEdge(edgeAC)).toBe(false);

        expect(vertexA.edges.length).toBe(2);

        expect(vertexA.edges[0].id).toBe('A_B');
        expect(vertexA.edges[0].key).toBe('E_A_B');
        expect(vertexA.edges[1].id).toBe('A_C');
        expect(vertexA.edges[1].key).toBe('E_A_C');

        let removed = vertexA.deleteEdge(edgeAB);
        expect(removed.id).toBe('A_B');
        expect(vertexA.hasEdge(edgeAB)).toBe(false);
        expect(vertexA.hasEdge(edgeAC)).toBe(true);
        expect(vertexA.edges[0].id).toBe('A_C');

        removed = vertexA.deleteEdge(edgeAC);
        expect(removed.id).toBe('A_C');
        expect(vertexA.hasEdge(edgeAB)).toBe(false);
        expect(vertexA.hasEdge(edgeAC)).toBe(false);
        expect(vertexA.edges.length).toBe(0);
    });


    it('支持从节点上删除所有的边', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        const vertexC = VertexModel.create({
            id: 'C'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        });

        vertexA.addEdge(edgeAB).addEdge(edgeAC);

        expect(vertexA.hasEdge(edgeAB)).toBe(true);
        expect(vertexB.hasEdge(edgeAB)).toBe(false);

        expect(vertexA.hasEdge(edgeAC)).toBe(true);
        expect(vertexC.hasEdge(edgeAC)).toBe(false);

        expect(vertexA.edges.length).toBe(2);

        vertexA.deleteAllEdges();

        expect(vertexA.hasEdge(edgeAB)).toBe(false);
        expect(vertexB.hasEdge(edgeAB)).toBe(false);

        expect(vertexA.hasEdge(edgeAC)).toBe(false);
        expect(vertexC.hasEdge(edgeAC)).toBe(false);

        expect(vertexA.edges.length).toBe(0);
    });

    it('当节点是开始节点，支持返回当前节点的所有相邻节点', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        const vertexC = VertexModel.create({
            id: 'C'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        });

        vertexA.addEdge(edgeAB).addEdge(edgeAC);

        // vertexB 节点对应的 edges 属性不存在，所以返回空集
        expect(vertexB.neighborIds).toEqual([]);

        const neighbors = vertexA.neighborIds;

        expect(neighbors.length).toBe(2);
        expect(neighbors[0]).toEqual(vertexB.id);
        expect(neighbors[1]).toEqual(vertexC.id);
    });

    it('当节点是结束节点，也能获取相邻节点属性', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        const vertexC = VertexModel.create({
            id: 'C'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        });

        vertexA.addEdge(edgeAB).addEdge(edgeAC);


        expect(vertexB.neighborIds).toEqual([]);

        const neighbors = vertexA.neighborIds;

        expect(neighbors.length).toBe(2);
        expect(neighbors[0]).toEqual(vertexB.id);
        expect(neighbors[1]).toEqual(vertexC.id);
    });

    it('检查当前节点是否存在指定的相邻节点', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        const vertexC = VertexModel.create({
            id: 'C'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        vertexA.addEdge(edgeAB)

        expect(vertexA.hasNeighbor(vertexB)).toBe(true);
        expect(vertexA.hasNeighbor(vertexC)).toBe(false);
    });


    it('能通过当前节点找到指定边', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        const vertexC = VertexModel.create({
            id: 'C'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        vertexA.addEdge(edgeAB)

        expect(vertexA.findEdgeByVertex(vertexB)).toEqual(edgeAB);
        expect(vertexA.findEdgeByVertex(vertexC)).toBeNull();
    });

    it('获取节点的 degree 数值', () => {
        const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });
        expect(vertexA.degree).toBe(0);

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        vertexA.addEdge(edgeAB);

        expect(vertexA.degree).toBe(1);

        const edgeBA = EdgeModel.create({
            startVid: vertexB.id,
            endVid: vertexA.id
        });;
        vertexA.addEdge(edgeBA);

        expect(vertexA.degree).toBe(2);
    });

    it('重复添加同一条边将报错', ()=>{
          const vertexA = VertexModel.create({
            id: 'A'
        });
        const vertexB = VertexModel.create({
            id: 'B'
        });

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        vertexA.addEdge(edgeAB);

        expect(()=>{
            vertexA.addEdge(edgeAB);
        }).toThrow();

    })

});