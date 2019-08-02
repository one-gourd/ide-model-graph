import { EdgeModel, VertexModel, GraphModel, IGraphModelSnapshot, IVertexModelSnapshot } from '../../src';

describe('Graph - 图', () => {
    it('支持在图中添加节点', () => {
        const graph = GraphModel.create({
            id: 'G'
        });

        const vertexA = VertexModel.create({
            id: "A"
        });
        const vertexB = VertexModel.create({
            id: "B"
        });

        graph
            .addVertex(vertexA)
            .addVertex(vertexB);

        expect(graph.id).toEqual('G');
        expect(graph.isDirected).toBeFalsy();
        expect(graph.getVertexById(vertexA.id)).toEqual(vertexA);
        expect(graph.getVertexById(vertexB.id)).toEqual(vertexB);
    });

    describe('支持在无向图中添加边 ', () => {
        let graph: IGraphModelSnapshot, vertexA: IVertexModelSnapshot, vertexB: IVertexModelSnapshot;

        beforeEach(()=>{
            graph = GraphModel.create({
                id: 'G'
            });

            vertexA = VertexModel.create({
                id: "A"
            });
            vertexB = VertexModel.create({
                id: "B"
            });
        })
        it('_addEdgeByEdge 方法（该方法建议内部使用）', ()=>{
            const edgeAB = EdgeModel.create({
                startVid: vertexA.id,
                endVid: vertexB.id
            });

            graph._addEdgeByEdge(edgeAB);

            // 只是 id 一致
            expect(graph.allVertices[0].id).toEqual(vertexA.id);
            expect(graph.allVertices[1].id).toEqual(vertexB.id);

            // 但添加边并不会将 原 vertex 添加到 graph 中，因为 edge 只提供 id 信息（因mst限制）
            // 因此在模型里，建议先添加节点、再添加边
            expect(graph.allVertices[0]).not.toBe(vertexA);
            expect(graph.allVertices[1]).not.toBe(vertexB);

        });

        it('addEdge 方法', ()=>{
            // 通过 addEdge 方法就能将节点添加 graph 中 
            graph.addEdge({start: vertexA, end: vertexB});
            expect(graph.allVertices[0]).toBe(vertexA);
            expect(graph.allVertices[1]).toBe(vertexB);
        })


        afterEach(()=>{

            expect(graph.allVertices.length).toBe(2);
            const graphVertexA = graph.getVertexById(vertexA.id);
            const graphVertexB = graph.getVertexById(vertexB.id);

            expect(graph.toString()).toBe(JSON.stringify({
                V: "A,B",
                E: "A_B,B_A"
            }));
            expect(graphVertexA).toBeDefined();
            expect(graphVertexB).toBeDefined();

            expect(graph.getVertexById('not existing')).toBeUndefined();

            expect(graphVertexA.neighborIds.length).toBe(1);
            expect(graphVertexA.neighborIds[0]).toEqual(vertexB.id);
            expect(graphVertexA.neighborIds[0]).toEqual(graphVertexB.id);

            expect(graphVertexB.neighborIds.length).toBe(1);
            expect(graphVertexB.neighborIds[0]).toEqual(vertexA.id);
            expect(graphVertexB.neighborIds[0]).toEqual(graphVertexA.id);
        })
       
    });


    describe('支持在有向图中添加边 ', () => {
        let graph: IGraphModelSnapshot, vertexA: IVertexModelSnapshot, vertexB: IVertexModelSnapshot;

        beforeEach(() => {
            graph = GraphModel.create({
                id: 'G',
                isDirected: true
            });

            vertexA = VertexModel.create({
                id: "A"
            });
            vertexB = VertexModel.create({
                id: "B"
            });
        })
        it('_addEdgeByEdge 方法（该方法建议内部使用）', () => {
            const edgeAB = EdgeModel.create({
                startVid: vertexA.id,
                endVid: vertexB.id
            });

            graph._addEdgeByEdge(edgeAB);

            // 只是 id 一致
            expect(graph.allVertices[0].id).toEqual(vertexA.id);
            expect(graph.allVertices[1].id).toEqual(vertexB.id);

            // 但添加边并不会将 原 vertex 添加到 graph 中，因为 edge 只提供 id 信息（因mst限制）
            // 因此在模型里，建议先添加节点、再添加边
            expect(graph.allVertices[0]).not.toBe(vertexA);
            expect(graph.allVertices[1]).not.toBe(vertexB);

        });

        it('addEdge 方法', () => {
            // 通过 addEdge 方法就能将节点添加 graph 中 
            graph.addEdge({start: vertexA, end: vertexB});
            expect(graph.allVertices[0]).toBe(vertexA);
            expect(graph.allVertices[1]).toBe(vertexB);
        })


        afterEach(() => {

            expect(graph.allVertices.length).toBe(2);
            const graphVertexA = graph.getVertexById(vertexA.id);
            const graphVertexB = graph.getVertexById(vertexB.id);

            expect(graph.toString()).toBe(JSON.stringify({
                V: "A,B",
                E: "A_B"
            }));
            expect(graphVertexA).toBeDefined();
            expect(graphVertexB).toBeDefined();

            expect(graph.getVertexById('not existing')).toBeUndefined();

            expect(graphVertexA.neighborIds.length).toBe(1);
            expect(graphVertexA.neighborIds[0]).toEqual(vertexB.id);
            expect(graphVertexA.neighborIds[0]).toEqual(graphVertexB.id);

            expect(graphVertexB.neighborIds.length).toBe(0);
        })

    });


    it('支持在无向图中通过节点查找指定边', () => {

        const graph = GraphModel.create({
            id: 'G'
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
        
        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id,
            weight: 10,
        });
        const edgeBA = EdgeModel.create({
            endVid: vertexA.id,
            startVid: vertexB.id,
            weight: 10
        });

        graph._addEdgeByEdge(edgeAB);

        const graphEdgeAB = graph.findEdge(vertexA, vertexB);
        const graphEdgeBA = graph.findEdge(vertexB, vertexA);
        const graphEdgeAC = graph.findEdge(vertexA, vertexC);
        const graphEdgeCA = graph.findEdge(vertexC, vertexA);

        expect(graphEdgeAC).toBeNull();
        expect(graphEdgeCA).toBeNull();
        expect(graphEdgeAB).toBe(edgeAB);
        // 新增的 BA 边是内置新增的
        expect(graphEdgeBA).not.toBe(edgeBA);
        expect(graphEdgeBA).toEqual(edgeBA);
        expect(graphEdgeAB!.weight).toBe(10);
    });

    it('支持在有向图中通过节点查找指定边', () => {
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

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id,
            weight: 10,
        });

        graph._addEdgeByEdge(edgeAB);

        const graphEdgeAB = graph.findEdge(vertexA, vertexB);
        const graphEdgeBA = graph.findEdge(vertexB, vertexA);
        const graphEdgeAC = graph.findEdge(vertexA, vertexC);
        const graphEdgeCA = graph.findEdge(vertexC, vertexA);

        expect(graphEdgeAC).toBeNull();
        expect(graphEdgeCA).toBeNull();
        expect(graphEdgeBA).toBeNull();
        expect(graphEdgeAB).toBe(edgeAB);
        expect(graphEdgeAB!.weight).toBe(10);
    });

    describe('能返回指定节点的相邻节点', () => {

        let graph: IGraphModelSnapshot, vertexA: IVertexModelSnapshot, vertexB: IVertexModelSnapshot, vertexC: IVertexModelSnapshot;

        beforeEach(() => {
            graph = GraphModel.create({
                id: 'G',
                isDirected: true
            });

            vertexA = VertexModel.create({
                id: "A"
            });
            vertexB = VertexModel.create({
                id: "B"
            });
            vertexC = VertexModel.create({
                id: "C"
            });
        })

        it('_addEdgeByEdge 方法', ()=>{
            const edgeAB = EdgeModel.create({
                startVid: vertexA.id,
                endVid: vertexB.id
            });
            const edgeAC = EdgeModel.create({
                startVid: vertexA.id,
                endVid: vertexC.id
            });

            graph
                ._addEdgeByEdge(edgeAB)
                ._addEdgeByEdge(edgeAC);

            // 通过 addEdge 新增的节点只是新增节点
            const neighbors = graph.getNeighbors(vertexA);
            expect(neighbors.length).toBe(0);

            const vertexAInGraph = graph.getVertexById(vertexA.id);
            const neighbors2 = graph.getNeighbors(vertexAInGraph);
            expect(neighbors2.length).toBe(2);
            expect(neighbors2[0]).toEqual(vertexB);
            expect(neighbors2[1]).toEqual(vertexC);
        });

        it('addEdge 方法', ()=>{
            graph
                .addEdge({start: vertexA, end: vertexB})
                .addEdge({start: vertexA, end: vertexC});

            // 通过 addEdge 增加边才是王道
            const neighbors = graph.getNeighbors(vertexA);
            expect(neighbors.length).toBe(2);
            expect(neighbors[0]).toBe(vertexB);
            expect(neighbors[1]).toBe(vertexC);
        });


    });

    describe('当尝试添加两条边的时候，默认会抛出错误', () => {
        let graph: IGraphModelSnapshot, vertexA: IVertexModelSnapshot, vertexB: IVertexModelSnapshot;

        beforeEach(() => {
            graph = GraphModel.create({
                id: 'G',
                isDirected: true
            });

            vertexA = VertexModel.create({
                id: "A"
            });
            vertexB = VertexModel.create({
                id: "B"
            });
        });

        it('_addEdgeByEdge 方法', ()=>{
            const edgeAB = EdgeModel.create({
                startVid: vertexA.id,
                endVid: vertexB.id
            });
            expect(()=>{
                graph
                    ._addEdgeByEdge(edgeAB)
                    ._addEdgeByEdge(edgeAB);
            }).toThrow();
        });
        it('addEdge 方法', ()=>{
            expect(()=>{
                graph
                    .addEdge({start: vertexA, end: vertexB})
                    .addEdge({start: vertexA, end: vertexB});
            }).toThrow();
        });
    });

    describe('当尝试添加两条边的时候，可以通过最后一个参数为 true, 忽略错误提示', () => {
        let graph: IGraphModelSnapshot, vertexA: IVertexModelSnapshot, vertexB: IVertexModelSnapshot;

        beforeEach(() => {
            graph = GraphModel.create({
                id: 'G',
                isDirected: true
            });

            vertexA = VertexModel.create({
                id: "A"
            });
            vertexB = VertexModel.create({
                id: "B"
            });
        });

        it('_addEdgeByEdge 方法', ()=>{
            const edgeAB = EdgeModel.create({
                startVid: vertexA.id,
                endVid: vertexB.id
            });
            expect(()=>{
                graph
                    ._addEdgeByEdge(edgeAB, true)
                    ._addEdgeByEdge(edgeAB, true);
            }).not.toThrow();
        });
        it('addEdge 方法', ()=>{
            expect(()=>{
                graph
                    .addEdge({start: vertexA, end: vertexB}, true)
                    .addEdge({start: vertexA, end: vertexB}, true);
            }).not.toThrow();
        });
    });

    it('可以返回图中所有的边', () => {
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

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });
        const edgeBC = EdgeModel.create({
            startVid: vertexB.id,
            endVid: vertexC.id
        });
    
        graph
            .addEdge({start: vertexA, end: vertexB})
            .addEdge({start: vertexB, end: vertexC});

        const edges = graph.allEdges;

        expect(edges.length).toBe(2);
        expect(edges[0]).toEqual(edgeAB);
        expect(edges[1]).toEqual(edgeBC);
        expect(edges[0]).not.toBe(edgeAB);
        expect(edges[1]).not.toBe(edgeBC);
    });


    it('计算无权重图的权重总和为 0', () => {
        const graph = GraphModel.create({
            id: 'G'
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
            .addEdge({start: vertexA, end: vertexB})
            .addEdge({start: vertexB, end: vertexC})
            .addEdge({start: vertexC, end: vertexD})
            .addEdge({start: vertexA, end: vertexD});

        expect(graph.weight).toBe(0);
    });

    it('计算有权重图中的总和', () => {
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
            .addEdge({start: vertexA, end: vertexB, weight: 1})
            .addEdge({start: vertexB, end: vertexC, weight: 2})
            .addEdge({start: vertexC, end: vertexD, weight: 3})
            .addEdge({start: vertexA, end: vertexD, weight: 4});

        expect(graph.weight).toBe(10);
    });

    it('支持从图中删除多条边', () => {
        const graph = GraphModel.create({
            id: 'G'
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

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });

        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        })

        graph
            .addEdge({ start: vertexA, end: vertexB })
            .addEdge({ start: vertexB, end: vertexC })
            .addEdge({ start: vertexA, end: vertexC })

        // 无向图相当于新增 2 倍有向边
        expect(graph.allEdges.length).toBe(6);

        graph.deleteEdge(edgeAB);
        expect(graph.allEdges.length).toBe(4);

        graph.deleteEdge(edgeAC);
        expect(graph.allEdges.length).toBe(2);

    });

    it('当从图中删除不存在的边，默认将抛出错误', () => {
        const graph = GraphModel.create({
            id: 'G'
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

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });

        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        })

        graph
            .addEdge({ start: vertexA, end: vertexB })
            .addEdge({ start: vertexB, end: vertexC })

        // 无向图相当于新增 2 倍有向边
        expect(graph.allEdges.length).toBe(4);

        graph.deleteEdge(edgeAB);
        expect(graph.allEdges.length).toBe(2);

        expect(()=>{
            graph.deleteEdge(edgeAC);
        }).toThrow();
    });


    it('当从图中删除不存在的边，可以通过设置第二个参数为 true，忽略错误', () => {
        const graph = GraphModel.create({
            id: 'G'
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

        const edgeAB = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexB.id
        });

        const edgeAC = EdgeModel.create({
            startVid: vertexA.id,
            endVid: vertexC.id
        })

        graph
            .addEdge({ start: vertexA, end: vertexB })
            .addEdge({ start: vertexB, end: vertexC })

        // 无向图相当于新增 2 倍有向边
        expect(graph.allEdges.length).toBe(4);

        graph.deleteEdge(edgeAB);
        expect(graph.allEdges.length).toBe(2);

        expect(()=>{
            graph.deleteEdge(edgeAC, true);
            expect(graph.allEdges.length).toBe(2);
        }).not.toThrow();
    });

    it('支持图中所有边反向', () => {
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
            .addEdge({ start: vertexA, end: vertexB})
            .addEdge({ start: vertexC, end: vertexD})
            .addEdge({ start: vertexA, end: vertexC});

        expect(graph.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,A_C,C_D"
        }));

        expect(graph.allEdges.length).toBe(3);
        expect(graph.getNeighbors(vertexA).length).toBe(2);
        expect(graph.getNeighbors(vertexA)[0].id).toBe(vertexB.id);
        expect(graph.getNeighbors(vertexA)[1].id).toBe(vertexC.id);
        expect(graph.getNeighbors(vertexB).length).toBe(0);
        expect(graph.getNeighbors(vertexC).length).toBe(1);
        expect(graph.getNeighbors(vertexC)[0].id).toBe(vertexD.id);
        expect(graph.getNeighbors(vertexD).length).toBe(0);

        graph.reverse();


        expect(graph.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "B_A,C_A,D_C"
        }));
        expect(graph.allEdges.length).toBe(3);
        expect(graph.getNeighbors(vertexA).length).toBe(0);
        expect(graph.getNeighbors(vertexB).length).toBe(1);
        expect(graph.getNeighbors(vertexB)[0].id).toBe(vertexA.id);
        expect(graph.getNeighbors(vertexC).length).toBe(1);
        expect(graph.getNeighbors(vertexC)[0].id).toBe(vertexA.id);
        expect(graph.getNeighbors(vertexD).length).toBe(1);
        expect(graph.getNeighbors(vertexD)[0].id).toBe(vertexC.id);

    });
    
    it('能返回节点索引映射表', () => {
        const graph = GraphModel.create({
            id: 'G'
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
            .addEdge({ start: vertexA, end: vertexB})
            .addEdge({ start: vertexC, end: vertexD})
            .addEdge({ start: vertexB, end: vertexD})
            .addEdge({ start: vertexB, end: vertexC});

        const verticesIndices = graph.verticesIndices;
        expect(verticesIndices).toEqual({
            A: 0,
            B: 1,
            C: 2,
            D: 3,
        });
    });

    it('支持无向图生成相邻矩阵', () => {
        const graph = GraphModel.create({
            id: 'G'
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
            .addEdge({ start: vertexA, end: vertexB})
            .addEdge({ start: vertexB, end: vertexC})
            .addEdge({ start: vertexC, end: vertexD})
            .addEdge({ start: vertexB, end: vertexD});

        const adjacencyMatrix = graph.adjacencyMatrix;
        expect(adjacencyMatrix).toEqual([
            [Infinity, 0, Infinity, Infinity],
            [0, Infinity, 0, 0],
            [Infinity, 0, Infinity, 0],
            [Infinity, 0, 0, Infinity],
        ]);
    });

    it('支持有向图生成相邻矩阵', () => {
        const graph = GraphModel.create({
            id: 'G',
            isDirected: true
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
            .addEdge({ start: vertexA, end: vertexB, weight: 2})
            .addEdge({ start: vertexB, end: vertexC, weight: 1})
            .addEdge({ start: vertexC, end: vertexD, weight: 5})
            .addEdge({ start: vertexB, end: vertexD, weight: 7});

        const adjacencyMatrix = graph.adjacencyMatrix;
        expect(adjacencyMatrix).toEqual([
            [Infinity, 2, Infinity, Infinity],
            [Infinity, Infinity, 1, 7],
            [Infinity, Infinity, Infinity, 5],
            [Infinity, Infinity, Infinity, Infinity],
        ]);
    });




});