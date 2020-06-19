
import { expect } from 'chai';

import helper from './sqlsrv-helper.js';
import PushManager from '../src/push-manager.js';

const data1 = helper.generateSpBills([1, 2, 3]);
const data2 = helper.generateSpBills([4, 5]);
const data3 = [ ...helper.modifySpBills(data1, [2, 3], 'XXX'), ...data2 ];

describe('PushMager#push', () => {
  helper.deleteAllSpBills();
  const pm = PushManager.create('test');
  let r;

  it('push data to SQL Server', async () => {
    r = await pm.push(data1);
    expect(r.rowsAffected).to.eql([3]);
    r = await helper.countSpBills();
    expect(r).to.equal(3);
    r = await helper.selectSpBills();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'REPORT2', 'REPORT3']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'MEASURE2', 'MEASURE3']);

    r = await pm.push(data3);
    expect(r.rowsAffected).to.eql([5]);
    r = await helper.countSpBills();
    expect(r).to.equal(5);
    r = await helper.selectSpBills();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'XXX2', 'XXX3', 'REPORT4', 'REPORT5']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'XXX2', 'XXX3', 'MEASURE4', 'MEASURE5']);
  });
});
