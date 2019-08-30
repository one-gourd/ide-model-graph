import {
    VertexModel,
    GraphModel,
    IGraphModel,
    IVertexModel,
} from '../../../src';

describe('Graph [clone] - 克隆', () => {
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
            .addEdge({ start: vertexB, end: vertexD, weight: 3 });
    });

    it('默认拷贝的 graph 数据和原来保持一致', ()=>{
        expect(graph.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,B_C,B_D"
        }));
        expect(graph.weight).toBe(6);
        expect(graph.id).toBe('G');
        expect(graph.isDirected).toBeTruthy();

        const clonedGraph = graph.clone();
        expect(clonedGraph.id).toBe('G');
        expect(clonedGraph.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,B_C,B_D"
        }));
        expect(clonedGraph.weight).toBe(6);
        expect(clonedGraph.isDirected).toBeTruthy();
    });

    it('拷贝时可指定 clone 函数', () => {

        let gcount1 = 1;
        let gcount2 = 1;

        const graphCloneFns = {
            cloneId: (id: string) => {
                return `${id}${gcount1++}`;
            },
            cloneMeta: (meta: any) => {
                return { foo: `bar${gcount2++}`, ...meta };
            }
        };

        expect(graph.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,B_C,B_D"
        }));
        expect(graph.weight).toBe(6);
        expect(graph.id).toBe('G');
        expect(graph.meta).toEqual({});
        expect(graph.isDirected).toBeTruthy();

        const clonedGraph1 = graph.clone(graphCloneFns);
        expect(clonedGraph1.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,B_C,B_D"
        }));
        expect(clonedGraph1.weight).toBe(6);
        expect(clonedGraph1.id).toBe('G1');
        expect(clonedGraph1.meta).toEqual({foo: 'bar1'});
        expect(clonedGraph1.isDirected).toBeTruthy();

        const clonedGraph2 = graph.clone(graphCloneFns);
        expect(clonedGraph2.id).toBe('G2');
        expect(clonedGraph2.meta).toEqual({ foo: 'bar2' });
        expect(clonedGraph2.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,B_C,B_D"
        }));
        expect(clonedGraph2.weight).toBe(6);
        expect(clonedGraph2.isDirected).toBeTruthy();

    });

    it('拷贝时可指定 clone 函数，同时也可以指定 vertex clone 函数', () => {
        let vcount1 = 1;

        let gcount1 = 1;
        let gcount2 = 1;

        const graphCloneFns = {
            cloneId: (id: string) => {
                return `${id}${gcount1++}`;
            },
            cloneMeta: (meta: any) => {
                return { foo: `bar${gcount2++}`, ...meta };
            }
        };
        const vertexCloneFns = {
            cloneId: (id: string) => {
                return `${id}${vcount1++}`;
            },
            cloneMeta: (meta: any, id: string) => {
                return { foo: `bar-${id}`, ...meta };
            }
        }

        expect(graph.toString()).toBe(JSON.stringify({
            V: "A,B,C,D",
            E: "A_B,B_C,B_D"
        }));
        expect(graph.weight).toBe(6);
        expect(graph.isDirected).toBeTruthy();

        const clonedGraph1 = graph.clone(graphCloneFns, vertexCloneFns);
        expect(clonedGraph1.toString()).toBe(JSON.stringify({
            V: "A1,B2,C3,D4",
            E: "A1_B2,B2_C3,B2_D4"
        }));
        expect(clonedGraph1.weight).toBe(6);
        expect(clonedGraph1.id).toBe('G1');
        expect(clonedGraph1.meta).toEqual({ foo: 'bar1' });
        expect(clonedGraph1.isDirected).toBeTruthy();

        const firstVertex = clonedGraph1.firstVertices[0];
        expect(firstVertex.id).toBe('A1');
        expect(firstVertex.meta).toEqual({
            foo: 'bar-A'
        });
    });


});