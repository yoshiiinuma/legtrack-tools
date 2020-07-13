
import { expect } from 'chai';
import sinon from 'sinon';

import MeasurePusher from '../src/measure-pusher.js';
import Pusher from '../src/pusher.js';
import Measure from '../src/local-measure.js';
import RemoteMeasure from '../src/remote-measure.js';
import LocalMeasure from '../src/local-measure.js';

const local = LocalMeasure.create('test');
const remote = RemoteMeasure.create('test');

describe('MeasurePusher#run', () => {
  let stub1, stub2, stub3, stub4;

  beforeEach(() => {
    stub1 = sinon.stub();
    stub2 = sinon.stub(Pusher, 'create').returns({ run: stub1 });
    stub3 = sinon.stub(LocalMeasure, 'create').returns(local);
    stub4 = sinon.stub(RemoteMeasure, 'create').returns(remote);
  });

  afterEach(() => {
    stub2.restore();
    stub3.restore();
    stub4.restore();
  });

  it('calls Pusher.cerate with correct arguments', () => {
    MeasurePusher.run();

    expect(stub2.calledWith('MEASURE', local, remote, 'test')).to.be.true;
    expect(stub1.called).to.be.true;
  });
});

