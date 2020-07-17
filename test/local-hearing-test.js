
import { expect } from 'chai';

import Hearing from '../src/local-hearing.js';
import helper from './sqlite-helper.js';

const model = Hearing.create('test');
const year = 2020;

const dataWithNoType = {
  "measureTypeOrig":"None",
  "measureType":"none",
  "measureNumber":0,
  "year":2020,
  "committee":"INFO-SCOVID-COV",
  "measureRelativeUrl":"https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=None&billnumber=0",
  "code":"Informational Briefing",
  "description":"Informational Briefing",
  "datetime":"7/16/2020 2:00 PM",
  "timestamp":1594944000000,
  "room":"211",
  "notice":"HEARING_SCOVID_07-16-20_INFO",
  "noticeUrl":"https://www.capitol.hawaii.gov/session2020/hearingnotices/HEARING_SCOVID_07-16-20_INFO_.HTM",
  "noticePdfUrl":"https://www.capitol.hawaii.gov/session2020/hearingnotices/HEARING_SCOVID_07-16-20_INFO_.pdf"
};

describe('Hearing#compare', () => {
  const rec = helper.generateHearings([1], year, 'hb');
  let r;

  it('compares two hearing recourds', async () => {
    r = await model.compare(rec, rec);
    expect(r).to.be.true;
    r = await model.compare(rec, { ...rec, ...{ year: 2019 } });
    expect(r).to.equal(false);
    r = await model.compare(rec, { ...rec, ...{ code: 'XXX' } });
    expect(r).to.equal(false);
    r = await model.compare(rec, { ...rec, ...{ committee: 'XXX' } });
    expect(r).to.equal(false);
    r = await model.compare(rec, { ...rec, ...{ description: 'XXX' } });
    expect(r).to.equal(false);
  });
});

describe('Hearing#sortout', () => {
  context('with normal hearing data', () => {
    const data1 = [...helper.generateHearings([1,2,4], year, 'hb'),
                   ...helper.generateHearings([1,2,4], year, 'sb'),
                   ...helper.generateHearings([1,2,4], year, 'gm')];
    const data2 = [...helper.generateHearings([2,3,4], year, 'hb'),
                   ...helper.generateHearings([2,3,4], year, 'sb'),
                   ...helper.generateHearings([2,3,4], year, 'gm')];
    const data3 = helper.modifyHearings(data2, [2], 'XXX')

    beforeEach(async () => {
      await model.deleteAll();
      await model.bulkInsert(data1)
    });

    it('returns array of measureNumbers', async () => {
      const r = await model.sortout(year, data3);
      expect(r['needInsert'].map((e => e.code))).to.eql(['HB3','SB3','GM3']);
      expect(r['needUpdate'].map((e => e.code))).to.eql(['HB2','SB2','GM2']);
      expect(r['ignore'].map((e => e.code))).to.eql(['HB4','SB4','GM4']);
    });
  });

  context('with record that do not have measureType', () => {

    beforeEach(async () => {
      await model.deleteAll();
      await model.bulkInsert([dataWithNoType])
    });

    it('can sort out data without measureType', async () => {
      let r = await model.sortout(year, [dataWithNoType]);
      expect(r['ignore'].length).to.equal(1);

      r = await model.sortout(year, [{ ...dataWithNoType, committee: 'XXXX' }]);
      expect(r['needUpdate'].length).to.equal(1);
    })
  });
});

describe('Hearing#convertToMap', () => {
  const data = helper.generateHearings([1,2,3]);
  let r;

  it('returns hashmap<measureNumber, record>', async () => {
    await model.deleteAll();
    r = model.convertToMap(data);
    expect(r['hb'][1]['NOTICE1']).to.eql(data[0]);
    expect(r['hb'][2]['NOTICE2']).to.eql(data[1]);
    expect(r['hb'][3]['NOTICE3']).to.eql(data[2]);
  });
});

describe('Hearing#selectAllByType', () => {
  const data = [...helper.generateHearings([1,2,3,4,5], year, 'hb'),
                ...helper.generateHearings([2,3,4,5,6], year, 'sb'),
                ...helper.generateHearings([3,4,5,6,7], year, 'gm')];
  let r;

  it('returns array of measureNumbers', async () => {
    await model.deleteAll();
    await model.bulkInsert(data)
    r = await model.selectAllByType(year, 'hb');
    expect(r.map(e => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    r = await model.selectAllByType(year, 'sb');
    expect(r.map(e => e.measureNumber)).to.eql([2, 3, 4, 5, 6]);
    r = await model.selectAllByType(year, 'gm');
    expect(r.map(e => e.measureNumber)).to.eql([3, 4, 5, 6, 7]);
  });
});

describe('Hearing#insert', () => {
  const data = helper.generateHearing(1);
  let r;

  it('inserts a record into hearings', async () => {
    await model.deleteAll();
    r = await model.count();
    expect(r['COUNT(*)']).to.equal(0);
    r = await model.insert(data)
    expect(r['changes']).to.equal(1);
    r = await model.count();
    expect(r['COUNT(*)']).to.equal(1);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1]);
    expect(r.map((e) => e.committee)).to.eql(['COMMITTEE1']);
    expect(r.map((e) => e.notice)).to.eql(['NOTICE1']);
    expect(r.map((e) => e.description)).to.eql(['DESCRIPTION1']);
  });
});

describe('Hearing#update', () => {
  const data = helper.generateHearing(1);
  const newData = { ...data, ...{ description: 'XXX1', room: 'YYY1' }};
  let r;

  it('insert a record into hearings', async () => {
    await model.deleteAll();
    r = await model.insert(data)
    r = await model.update(newData);
    expect(r['changes']).to.equal(1);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1]);
    expect(r.map((e) => e.room)).to.eql(['YYY1']);
    expect(r.map((e) => e.description)).to.eql(['XXX1']);
    expect(r.map((e) => e.notice)).to.eql(['NOTICE1']);
  });
});

describe('Hearing#bulkInsert', () => {
  const data = helper.generateHearings([1, 2, 3, 4, 5]);
  let r;

  it('inserts multiple data', async () => {
    await model.deleteAll();
    await model.bulkInsert(data);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.room)).to.eql(['ROOM1', 'ROOM2', 'ROOM3', 'ROOM4', 'ROOM5']);
    expect(r.map((e) => e.description)).to.eql(['DESCRIPTION1', 'DESCRIPTION2', 'DESCRIPTION3', 'DESCRIPTION4', 'DESCRIPTION5']);
    expect(r.map((e) => e.notice)).to.eql(['NOTICE1', 'NOTICE2', 'NOTICE3', 'NOTICE4', 'NOTICE5']);
  });
});

describe('Hearing#bulkUpsert', () => {
  const data = helper.generateHearings([1, 2, 3]);
  const data2 = helper.generateHearings([4, 5]);
  const data3 = [...helper.modifyHearings(data, [2, 3], 'XXX'), ...data2];

  let r;

  it('upserts multiple data', async () => {
    await model.deleteAll();

    r = await model.bulkUpsert(data, year);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map((e) => e.room)).to.eql(['ROOM1', 'ROOM2', 'ROOM3']);
    expect(r.map((e) => e.description)).to.eql(['DESCRIPTION1', 'DESCRIPTION2', 'DESCRIPTION3']);
    expect(r.map((e) => e.notice)).to.eql(['NOTICE1', 'NOTICE2', 'NOTICE3']);

    r = await model.bulkUpsert(data3, year);
    r = await model.selectAll();
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3, 4, 5]);
    expect(r.map((e) => e.room)).to.eql(['ROOM1', 'XXX2', 'XXX3', 'ROOM4', 'ROOM5']);
    expect(r.map((e) => e.description)).to.eql(['DESCRIPTION1', 'XXX2', 'XXX3', 'DESCRIPTION4', 'DESCRIPTION5']);
    expect(r.map((e) => e.notice)).to.eql(['NOTICE1', 'NOTICE2', 'NOTICE3', 'NOTICE4', 'NOTICE5']);
  });
});
