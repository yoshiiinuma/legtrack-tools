
import { expect } from 'chai';

import SpMeasure from '../src/local-sp-measure.js';
import helper from './sqlite-helper.js';

describe('SpMeasure#compare', () => {
  const model = SpMeasure.create('test');
  const rec = helper.generateSpBills([1], 2020, 'a', 'hb');
  let r;

  it('compares two spMeasure recourds', async () => {
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

describe('SpMeasure#sortout', () => {
  const model = SpMeasure.create('test');
  const data1 = [...helper.generateSpBills([1,2,4], 2020, 'a', 'hb'),
                 ...helper.generateSpBills([1,2,4], 2020, 'a', 'sb'),
                 ...helper.generateSpBills([1,2,4], 2020, 'a', 'gm')];
  const data2 = [...helper.generateSpBills([2,3,4], 2020, 'a', 'hb'),
                 ...helper.generateSpBills([2,3,4], 2020, 'a', 'sb'),
                 ...helper.generateSpBills([2,3,4], 2020, 'a', 'gm')];
  const data3 = helper.modifySpBills(data2, [2], 'XXX')
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

describe('SpMeasure#convertToMap', () => {
  const model = SpMeasure.create('test');
  const data = helper.generateSpBills([1,2,3]);
  let r;

  it('returns hashmap<measureNumber, record>', async () => {
    await model.deleteAll();
    r = model.convertToMap(data);
    expect(r[1]).to.eql(data[0]);
    expect(r[2]).to.eql(data[1]);
    expect(r[3]).to.eql(data[2]);
  });
});

describe('SpMeasure#selectSpMeasuresByType', () => {
  const model = SpMeasure.create('test');
  const data = [...helper.generateSpBills([1,2,3,4,5], 2020, 'a', 'hb'),
                ...helper.generateSpBills([2,3,4,5,6], 2020, 'a', 'sb'),
                ...helper.generateSpBills([3,4,5,6,7], 2020, 'a', 'gm')];
  let r;

  it('returns array of measureNumbers', async () => {
    await model.deleteAll();
    await model.bulkInsert(data)
    r = await model.selectSpMeasuresByType(2020, 'a', 'hb');
    expect(r.map(e => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    r = await model.selectSpMeasuresByType(2020, 'a', 'sb');
    expect(r.map(e => e.measureNumber)).to.eql([2, 3, 4, 5, 6]);
    r = await model.selectSpMeasuresByType(2020, 'a', 'gm');
    expect(r.map(e => e.measureNumber)).to.eql([3, 4, 5, 6, 7]);
  });
});

describe('SpMeasure#insert', () => {
  const model = SpMeasure.create('test');
  const data = helper.generateSpBill(1);
  let r;

  it('inserts a record into spMeasures', async () => {
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

describe('SpMeasure#update', () => {
  const model = SpMeasure.create('test');
  const data = helper.generateSpBill(1);
  const newData = { ...data, ...{ measureTitle: 'XXX1', reportTitle: 'YYY1' }};
  let r;

  it('insert a record into spMeasures', async () => {
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

describe('SpMeasure#bulkInsert', () => {
  const model = SpMeasure.create('test');
  const data = helper.generateSpBills([1, 2, 3, 4, 5]);
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

describe('SpMeasure#bulkUpsert', () => {
  const model = SpMeasure.create('test');
  const data = helper.generateSpBills([1, 2, 3]);
  const data2 = helper.generateSpBills([4, 5]);
  const data3 = [...helper.modifySpBills(data, [2, 3], 'XXX'), ...data2];

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
