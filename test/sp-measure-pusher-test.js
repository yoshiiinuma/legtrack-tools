
import { expect } from 'chai';
import sinon from 'sinon';

import SpMeasurePusher from '../src/sp-measure-pusher.js';
import Pusher from '../src/pusher.js';
import RemoteSpMeasure from '../src/remote-sp-measure.js';
import LocalSpMeasure from '../src/local-sp-measure.js';

const local = LocalSpMeasure.create('test');
const remote = RemoteSpMeasure.create('test');

describe('SpMeasurePusher#run', () => {
  let stub1, stub2, stub3, stub4;

  beforeEach(() => {
    stub1 = sinon.stub();
    stub2 = sinon.stub(Pusher, 'create').returns({ run: stub1 });
    stub3 = sinon.stub(LocalSpMeasure, 'create').returns(local);
    stub4 = sinon.stub(RemoteSpMeasure, 'create').returns(remote);
  });

  afterEach(() => {
    stub2.restore();
    stub3.restore();
    stub4.restore();
  });

  it('calls Pusher.cerate with correct arguments', () => {
    SpMeasurePusher.run();

    expect(stub2.calledWith('SP_MEASURE', local, remote, 'test')).to.be.true;
    expect(stub1.called).to.be.true;
  });
});

