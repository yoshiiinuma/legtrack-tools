
import { expect } from 'chai';

import PushJob from '../src/local-push-job.js';

let model;

beforeEach(() => {
  model = PushJob.create('test');
  model.deleteAll();
});

describe('PushJob#insert', () => {
  let r;

  it('inserts a record into pushJobs table', async () => {
    r = await model.insert(1, 2);
    expect(r.changes).to.equal(1);
    expect(r.lastInsertRowid).to.be.above(0);
    expect(r.startedAt).to.be.above(0);

    const id = r.lastInsertRowid;
    const startedAt = r.startedAt;
    r = await model.selectOne();
    expect(r.id).to.be.equal(id);
    expect(r.startedAt).to.equal(startedAt);
    expect(r.completedAt).to.be.null;
    expect(r.dataType).to.equal(1);
    expect(r.scrapeJobId).to.equal(2);
    expect(r.status).to.equal(1);
    expect(r.totalNumber).to.equal(0);
    expect(r.updatedNumber).to.equal(0);
  });
});

describe('PushJob#update', () => {
  let r;

  it('updates the specified record', async () => {
    r = await model.insert(1, 2);
    const id = r.lastInsertRowid;
    const startedAt = r.startedAt;

    r = await model.update(id, 4, 8, 7);

    r = await model.selectOne();
    expect(r.id).to.be.equal(id);
    expect(r.startedAt).to.equal(startedAt);
    expect(r.completedAt).to.be.above(0);
    expect(r.dataType).to.equal(1);
    expect(r.scrapeJobId).to.equal(2);
    expect(r.status).to.equal(4);
    expect(r.totalNumber).to.equal(8);
    expect(r.updatedNumber).to.equal(7);
  });
});

describe('PushJob#selectLatestPush', () => {
  let r;
  let jobId = 99;
  const type = 1;

  context('When data exist', () => {
    it('returns the latest completed pushJob', async () => {
      r = await model.insert(type, 1);
      r = await model.update(r.lastInsertRowid, 4, 1, 1);
      r = await model.insert(type, 2);
      r = await model.update(r.lastInsertRowid, 4, 2, 2);
      r = await model.insert(type, jobId);
      const id = r.lastInsertRowid;
      r = await model.update(r.lastInsertRowid, 4, 3, 3);
      r = await model.selectLatestPush(type);
      expect(r.scrapeJobId).to.equal(jobId);
      expect(r.id).to.equal(id);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
    });
  });

  context('When no data exist', () => {
    it('returns undefined', async () => {
      r = await model.selectLatestPush(type);
      expect(r).to.equal(undefined);
    });
  });
});

describe('PushJob#selectLastProcessedScrapeJobId', () => {
  let r;
  let jobId = 99;
  const type = 1;

  context('When data exist', () => {
    it('returns the scrapeJobId of the latest completed pushJob', async () => {
      r = await model.insert(type, 1);
      r = await model.update(r.lastInsertRowid, 4, 1, 1);
      r = await model.insert(type, 2);
      r = await model.update(r.lastInsertRowid, 4, 2, 2);
      r = await model.insert(type, jobId);
      r = await model.update(r.lastInsertRowid, 4, 3, 3);
      r = await model.selectLastProcessedScrapeJobId(type);
      expect(r).to.equal(jobId);
    });
  });

  context('When no data exist', () => {
    it('returns 0', async () => {
      r = await model.selectLastProcessedScrapeJobId(type);
      expect(r).to.equal(0);
    });
  });
});

