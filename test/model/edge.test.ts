import { EdgeModel, VertexModel } from '../../src';

describe('Edge - 边 逻辑功能', () => {
  test('以默认权重创建边模型', () => {
    const startVertex = VertexModel.create({
      id: 'A'
    });
    const endVertex = VertexModel.create({
      id: 'B'
    });

    const edge = EdgeModel.create({
      startVid: startVertex.id,
      endVid: endVertex.id
    });
    expect(edge.id).toBe('A_B');
    expect(edge.key).toBe('E_A_B');
    expect(edge.startVid).toEqual(startVertex.id);
    expect(edge.endVid).toEqual(endVertex.id);
    expect(edge.weight).toEqual(0);
  });
  it('可以自定边的权重', () => {
    const startVertex = VertexModel.create({
      id: 'A'
    });
    const endVertex = VertexModel.create({
      id: 'B'
    });
    const edge = EdgeModel.create({
      startVid: startVertex.id,
      endVid: endVertex.id,
      weight: 10
    });
    expect(edge.startVid).toEqual(startVertex.id);
    expect(edge.endVid).toEqual(endVertex.id);
    expect(edge.weight).toEqual(10);
  });

  it('支持边的方向反转', () => {
    const vertexA = VertexModel.create({
      id: 'A'
    });
    const vertexB = VertexModel.create({
      id: 'B'
    });

    const edge = EdgeModel.create({
      startVid: vertexA.id,
      endVid: vertexB.id,
      weight: 10
    });
    expect(edge.startVid).toEqual(vertexA.id);
    expect(edge.endVid).toEqual(vertexB.id);
    expect(edge.weight).toEqual(10);

    edge.reverse();

    expect(edge.startVid).toEqual(vertexB.id);
    expect(edge.endVid).toEqual(vertexA.id);
    expect(edge.weight).toEqual(10);
    expect(edge.key).toBe('E_B_A');

  });

});

describe('Edge - 边 模型功能', () => {
  it('创建后的模型，支持修改', () => {
    const startVertex = VertexModel.create({
      id: 'A'
    });
    const endVertex = VertexModel.create({
      id: 'B'
    });

    const edge = EdgeModel.create({
      startVid: startVertex.id,
      endVid: endVertex.id
    });
    expect(edge.id).toBe('A_B');
    expect(edge.startVid).toEqual(startVertex.id);
    expect(edge.endVid).toEqual(endVertex.id);
    expect(edge.weight).toEqual(0);

    edge.setStartVid('C');
    edge.setEndVid('D');
    edge.setWeight(10);

    expect(edge.id).toBe('C_D');
    expect(edge.startVid).toBe('C');
    expect(edge.endVid).toBe('D');
    expect(edge.weight).toEqual(10);

  });

  it('创建后的模型，支持修改 meta 信息', ()=>{
    const startVertex = VertexModel.create({
      id: 'A'
    });
    const endVertex = VertexModel.create({
      id: 'B'
    });

    const edge = EdgeModel.create({
      startVid: startVertex.id,
      endVid: endVertex.id,
      // 直接放在 create 里无效
      meta: {
        input: 'hello world'
      }
    });

    // 直接返回是 {}
    expect(edge.meta).toEqual({});


    // 必须通过 setter 方式
    edge.setMeta({
      input: 'hello world'
    });

    expect(edge.meta).toEqual({
      input: 'hello world'
    });
  });
  
});


