
import { expect } from 'chai';

import ScrapeJob from '../src/local-scrape-job.js';

let model;

describe('ScrapeJobModel#insertJob', () => {
  let r;

  before(async () => {
    model = ScrapeJob.create('test');
    await model.deleteAllJobs();
  });

  it('inserts initial scrapeJob record', async () => {
    r = await model.insertJob(1);
    expect(r.changes).to.equal(1);
    expect(r.lastInsertRowid).to.be.above(0);
    expect(r.startedAt).to.be.above(0);

    r = await model.countJobs();
    expect(r['COUNT(*)']).to.equal(1);
    r = await model.selectOneJob();
    expect(r.id).to.not.be.null;
    expect(r.dataType).to.equal(1);
    expect(r.status).to.equal(1);
    expect(r.startedAt).to.not.be.null;
    expect(r.completedAt).to.be.null;
    expect(r.totalNumber).to.equal(0);
    expect(r.updatedNumber).to.equal(0);
    expect(r.updateNeeded).to.equal(0);
  });
});

describe('ScrapeJobModel#updateJob', () => {
  let r;
  let id, dataType, startedAt;

  before(async () => {
    model = ScrapeJob.create('test');
    await model.deleteAllJobs();
    r = await model.insertJob(1);
    r = await model.selectOneJob();
    id = r.id;
    dataType = r.dataType;
    startedAt = r.startedAt;
  });

  it('updates a scrapeJob record', async () => {
    r = await model.updateJob(id, 2, 10, 5);
    expect(r.changes).to.equal(1);

    r = await model.selectOneJob();
    expect(r.id).to.equal(id);
    expect(r.dataType).to.equal(dataType);
    expect(r.status).to.equal(2);
    expect(r.startedAt).to.equal(startedAt);
    expect(r.completedAt).to.not.be.null;
    expect(r.totalNumber).to.equal(10);
    expect(r.updatedNumber).to.equal(5);
    expect(r.updateNeeded).to.equal(1);
  });
});

describe('ScrapeJobModel#insertDetail', () => {
  before(async () => {
    model = ScrapeJob.create('test');
    await model.deleteAllDetails();
  });
  let r;

  it('inserts srapeDetails record', async () => {
    r = await model.insertDetail(5, 4, 3, 123, 20, 8);
    expect(r.changes).to.equal(1);
    expect(r.lastInsertRowid).to.be.above(0);

    r = await model.countDetails();
    expect(r['COUNT(*)']).to.equal(1);
    r = await model.selectOneDetail();
    expect(r.scrapeJobId).to.equal(5);
    expect(r.measureType).to.equal(4);
    expect(r.status).to.equal(3);
    expect(r.startedAt).to.equal(123);
    expect(r.completedAt).to.not.be.null;
    expect(r.totalNumber).to.equal(20);
    expect(r.updatedNumber).to.equal(8);
  });
});

describe('ScrapeJobModel#selectJobUpdatedAfter', () => {
  const type = 3;
  let r;
  let j1, j2, j3, j4, j5, j6;
  
  before(async () => {
    model = ScrapeJob.create('test');
    await model.deleteAllJobs();
    r = await model.insertJob(3);
    j1 = r.lastInsertRowid;
    r = await model.updateJob(r.lastInsertRowid, 4, 1, 1);
    r = await model.insertJob(3);
    r = await model.updateJob(r.lastInsertRowid, 2, 0, 0);
    r = await model.insertJob(3);
    r = await model.updateJob(r.lastInsertRowid, 2, 0, 0);
    r = await model.insertJob(3);
    j2 = r.lastInsertRowid;
    r = await model.updateJob(r.lastInsertRowid, 4, 2, 2);
    r = await model.insertJob(3);
    j3 = r.lastInsertRowid;
    r = await model.updateJob(r.lastInsertRowid, 4, 3, 3);
    r = await model.insertJob(3);
    j4 = r.lastInsertRowid;
    r = await model.updateJob(r.lastInsertRowid, 4, 4, 4);
    r = await model.insertJob(3);
    r = await model.updateJob(r.lastInsertRowid, 2, 0, 0);
    r = await model.insertJob(3);
    j5 = r.lastInsertRowid;
    r = await model.updateJob(r.lastInsertRowid, 4, 5, 5);
    r = await model.insertJob(3);
    j6 = r.lastInsertRowid;
    r = await model.updateJob(r.lastInsertRowid, 4, 6, 6);
    r = await model.insertJob(3);
    r = await model.updateJob(r.lastInsertRowid, 3, 0, 0);
    r = await model.insertJob(3);
    r = await model.updateJob(r.lastInsertRowid, 2, 0, 0);
  });

  it('returns the oldest job that has unprocessed data after given id', async () => {
    r = await model.selectJobUpdatedAfter(type, 0);
    expect(r.id).to.equal(j1);
    r = await model.selectJobUpdatedAfter(type, j1);
    expect(r.id).to.equal(j2);
    r = await model.selectJobUpdatedAfter(type, j2);
    expect(r.id).to.equal(j3);
    r = await model.selectJobUpdatedAfter(type, j3);
    expect(r.id).to.equal(j4);
    r = await model.selectJobUpdatedAfter(type, j4);
    expect(r.id).to.equal(j5);
    r = await model.selectJobUpdatedAfter(type, j5);
    expect(r.id).to.equal(j6);
  });

  it('returns undefined', async () => {
    r = await model.selectJobUpdatedAfter(type, j6);
    expect(r).to.equal(undefined);
  });
});
