
import { expect } from 'chai';

import Measure from '../src/local-measure.js';
import helper from './sqlite-helper.js';

describe('Measure#compare', () => {
  const model = Measure.create('test');
  const rec = helper.generateBills([1], 2020, 'hb');
  let r;

  it('compares two measure recourds', async () => {
    r = await model.compare(rec, rec);
    expect(r).to.be.true;
    r = await model.compare(rec, { ...rec, ...{ year: 2019 } });
    expect(r).to.equal(false);
    r = await model.compare(rec, { ...rec, ...{ code: 'XXX' } });
    expect(r).to.equal(false);
    r = await model.compare(rec, { ...rec, ...{ measureTitle: 'XXX' } });
    expect(r).to.equal(false);
  });
});

describe('Measure#sortout', () => {
  const model = Measure.create('test');
  const data1 = [...helper.generateBills([1,2,4], 2020, 'hb'),
                 ...helper.generateBills([1,2,4], 2020, 'sb'),
                 ...helper.generateBills([1,2,4], 2020, 'gm')];
  const data2 = [...helper.generateBills([2,3,4], 2020, 'hb'),
                 ...helper.generateBills([2,3,4], 2020, 'sb'),
                 ...helper.generateBills([2,3,4], 2020, 'gm')];
  const data3 = helper.modifyBills(data2, [2], 'XXX')
  let r;

  it('returns array of measureNumbers', async () => {
    await model.deleteAll();
    await model.bulkInsert(data1)
    r = await model.sortout(data3);
    expect(r['needInsert'].map((e => e.code))).to.eql(['HB3','SB3','GM3']);
    expect(r['needUpdate'].map((e => e.code))).to.eql(['HB2','SB2','GM2']);
    expect(r['ignore'].map((e => e.code))).to.eql(['HB4','SB4','GM4']);
  });
});

describe('Measure#convertToMap', () => {
  const model = Measure.create('test');
  const data = helper.generateBills([1,2,3]);
  let r;

  it('returns hashmap<measureNumber, record>', async () => {
    await model.deleteAll();
    r = model.convertToMap(data);
    expect(r[1]).to.eql(data[0]);
    expect(r[2]).to.eql(data[1]);
    expect(r[3]).to.eql(data[2]);
  });
});

describe('Measure#selectMeasuresByType', () => {
  const model = Measure.create('test');
  const data = [...helper.generateBills([1,2,3,4,5], 2020, 'hb'),
                ...helper.generateBills([2,3,4,5,6], 2020, 'sb'),
                ...helper.generateBills([3,4,5,6,7], 2020, 'gm')];
  let r;

  it('returns array of measureNumbers', async () => {
    await model.deleteAll();
    await model.bulkInsert(data)
    r = await model.selectMeasuresByType(2020, 'hb');
    expect(r.map(e => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    r = await model.selectMeasuresByType(2020, 'sb');
    expect(r.map(e => e.measureNumber)).to.eql([2, 3, 4, 5, 6]);
    r = await model.selectMeasuresByType(2020, 'gm');
    expect(r.map(e => e.measureNumber)).to.eql([3, 4, 5, 6, 7]);
  });
});

describe('Measure#insert', () => {
  const model = Measure.create('test');
  const data = helper.generateBill(1);
  let r;

  it('inserts a record into measures', async () => {
    await model.deleteAll();
    r = await model.count();
    expect(r['COUNT(*)']).to.equal(0);
    r = await model.insert(data)
    expect(r['changes']).to.equal(1);
    r = await model.count();
    expect(r['COUNT(*)']).to.equal(1);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1']);
    expect(r.map((e) => e.currentReferral)).to.eql(['REF1']);
  });
});

describe('Measure#update', () => {
  const model = Measure.create('test');
  const data = helper.generateBill(1);
  const newData = { ...data, ...{ measureTitle: 'XXX1', reportTitle: 'YYY1' }};
  let r;

  it('insert a record into measures', async () => {
    await model.deleteAll();
    r = await model.insert(data)
    r = await model.update(newData);
    expect(r['changes']).to.equal(1);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1]);
    expect(r.map((e) => e.reportTitle)).to.eql(['YYY1']);
    expect(r.map((e) => e.measureTitle)).to.eql(['XXX1']);
    expect(r.map((e) => e.currentReferral)).to.eql(['REF1']);
  });
});

describe('Measure#bulkInsert', () => {
  const model = Measure.create('test');
  const data = helper.generateBills([1, 2, 3, 4, 5]);
  let r;

  it('inserts multiple data', async () => {
    await model.deleteAll();
    await model.bulkInsert(data);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'REPORT2', 'REPORT3', 'REPORT4', 'REPORT5']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'MEASURE2', 'MEASURE3', 'MEASURE4', 'MEASURE5']);
    expect(r.map((e) => e.currentReferral)).to.eql(['REF1', 'REF2', 'REF3', 'REF4', 'REF5']);
  });
});

describe('Measure#bulkUpsert', () => {
  const model = Measure.create('test');
  const data = helper.generateBills([1, 2, 3]);
  const data2 = helper.generateBills([4, 5]);
  const data3 = [...helper.modifyBills(data, [2, 3], 'XXX'), ...data2];

  let r;

  it('upserts multiple data', async () => {
    await model.deleteAll();

    await model.bulkUpsert(data);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'REPORT2', 'REPORT3']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'MEASURE2', 'MEASURE3']);
    expect(r.map((e) => e.currentReferral)).to.eql(['REF1', 'REF2', 'REF3']);

    await model.bulkUpsert(data3);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REPORT1', 'XXX2', 'XXX3', 'REPORT4', 'REPORT5']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'XXX2', 'XXX3', 'MEASURE4', 'MEASURE5']);
    expect(r.map((e) => e.currentReferral)).to.eql(['REF1', 'REF2', 'REF3', 'REF4', 'REF5']);
  });
});
