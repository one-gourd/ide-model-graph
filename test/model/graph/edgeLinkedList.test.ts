import { EdgeModel, VertexModel, GraphModel, IGraphModelSnapshot, IVertexModelSnapshot, IGraphModel } from '../../../src';

const snapshot: any = {
    "id": "1397",
    "_meta": {
        "_value": "{\"branch\":\"ONE\",\"label\":\"并行1\",\"underVertex\":\"365b6\",\"parentGraphId\":\"MAIN\"}"
    },
    "isDirected": true,
    "vertices": {
        "de1e1": {
            "id": "de1e1",
            "_meta": {
                "_value": "{\"category\":\"action\",\"type\":\"If\",\"inputs\":{},\"expression\":{\"and\":[{\"equals\":[\"@{triggerBody()}\",\"@{triggerOutputs().headers}\"]}]}}"
            },
            "edges": []
        }
    }
};

describe('Graph - edgeLinkedList', () => {
    it('测试 edgeLinkedList 属性', ()=>{
        const graph = GraphModel.create(snapshot);

        expect(graph.id).toBe("1397");
        expect(graph.edgeLinkedList).toEqual(['de1e1']);

    });

})