
import { expect } from 'chai';

import helper from './sqlsrv-helper.js';
import RemoteMeasure from '../src/remote-measure.js';

const data1 = helper.generateBills([1, 2, 3]);
const data2 = helper.generateBills([4, 5]);
const data3 = [ ...helper.modifyBills(data1, [2, 3], 'XXX'), ...data2 ];

describe('RemoteMeasure#push', () => {
  const measure = RemoteMeasure.create('test');
  let r;

  beforeEach(async () => {
    helper.deleteAllBills();
  });

  it('push data to SQL Server', async () => {
    r = await measure.push(data1);
    expect(r.rowsAffected).to.eql([3]);
    r = await helper.countBills();
    expect(r).to.equal(3);
    r = await helper.selectBills();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'REPORT2', 'REPORT3']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'MEASURE2', 'MEASURE3']);

    r = await measure.push(data3);
    expect(r.rowsAffected).to.eql([5]);
    r = await helper.countBills();
    expect(r).to.equal(5);
    r = await helper.selectBills();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'XXX2', 'XXX3', 'REPORT4', 'REPORT5']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'XXX2', 'XXX3', 'MEASURE4', 'MEASURE5']);
  });
});
