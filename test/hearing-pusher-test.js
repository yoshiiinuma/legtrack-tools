
import { expect } from 'chai';
import sinon from 'sinon';

import HearingPusher from '../src/hearing-pusher.js';
import Pusher from '../src/pusher.js';
import RemoteHearing from '../src/remote-hearing.js';
import LocalHearing from '../src/local-hearing.js';

const local = LocalHearing.create('test');
const remote = RemoteHearing.create('test');

describe('HearingPusher#run', () => {
  let stub1, stub2, stub3, stub4;

  beforeEach(() => {
    stub1 = sinon.stub();
    stub2 = sinon.stub(Pusher, 'create').returns({ run: stub1 });
    stub3 = sinon.stub(LocalHearing, 'create').returns(local);
    stub4 = sinon.stub(RemoteHearing, 'create').returns(remote);
  });

  afterEach(() => {
    stub2.restore();
    stub3.restore();
    stub4.restore();
  });

  it('calls Pusher.cerate with correct arguments', () => {
    HearingPusher.run();

    expect(stub2.calledWith('HEARING', local, remote, 'test')).to.be.true;
    expect(stub1.called).to.be.true;
  });
});

