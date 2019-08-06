import { EdgeModel, VertexModel, GraphModel, IGraphModelSnapshot, IVertexModelSnapshot } from '../../../src';

describe('Graph - 删除操作', () => {

    it('支持在有向图中删除指定节点', () => {
        const graph = GraphModel.create({
            id: 'G',
            isDirected: true,
        });

        const vertexA = VertexModel.create({
            id: "A"
        });
        const vertexB = VertexModel.create({
            id: "B"
        });
        const vertexC = VertexModel.create({
            id: "C"
        });
        const vertexD = VertexModel.create({
            id: "D"
        });
        graph
            .addEdge({ start: vertexA, end: vertexB, weight: 1 })
            .addEdge({ start: vertexB, end: vertexC, weight: 2 })
            .addEdge({ start: vertexC, end: vertexD, weight: 3 })
            .addEdge({ start: vertexA, end: vertexD, weight: 4 });

        expect(graph.edgeLinkedList).toEqual(['A', 'B', 'C', 'D']);
        // 无向图相当于新增 2 倍有向边
        expect(graph.allEdges.length).toBe(4);
        let removed = graph.deleteVertex(vertexA);
        expect(removed.id).toBe("A");
        expect(graph.allEdges.length).toBe(2);
        expect(graph.edgeLinkedList).toEqual(['B', 'C', 'D']);


        removed = graph.deleteVertex(vertexB);
        expect(removed.id).toBe("B");
        expect(graph.allEdges.length).toBe(1);
        expect(graph.edgeLinkedList).toEqual(['C', 'D']);

        
    });
})


