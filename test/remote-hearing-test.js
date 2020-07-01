
import { expect } from 'chai';

import helper from './sqlsrv-helper.js';
import RemoteHearing from '../src/remote-hearing.js';

const data1 = helper.generateHearings([1, 2, 3]);
const data2 = helper.generateHearings([4, 5]);
const data3 = [ ...helper.modifyHearings(data1, [2, 3], 'XXX'), ...data2 ];

describe('RemoteHearing#push', () => {
  const hearing = RemoteHearing.create('test');
  let r;

  beforeEach(async () => {
    helper.deleteAllHearings();
  });

  it('push data to SQL Server', async () => {
    r = await hearing.push(data1);

    expect(r.rowsAffected).to.eql([3]);
    r = await helper.countHearings();
    expect(r).to.equal(3);
    r = await helper.selectHearings();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map((e) => e.description)).to.eql(['DESC1', 'DESC2', 'DESC3']);
    expect(r.map((e) => e.committee)).to.eql(['COMM1', 'COMM2', 'COMM3']);

    r = await hearing.push(data3);
    expect(r.rowsAffected).to.eql([5]);
    r = await helper.countHearings();
    expect(r).to.equal(5);
    r = await helper.selectHearings();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.description)).to.eql(['DESC1', 'XXX2', 'XXX3', 'DESC4', 'DESC5']);
    expect(r.map((e) => e.committee)).to.eql(['COMM1', 'XXX2', 'XXX3', 'COMM4', 'COMM5']);
  });
});
