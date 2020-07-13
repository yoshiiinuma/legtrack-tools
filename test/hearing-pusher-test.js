
import { expect } from 'chai';
import sinon from 'sinon';

import { pushHearings } from '../src/hearing-pusher.js';
import PushJob from '../src/local-push-job.js';
import ScrapeJob from '../src/local-scrape-job.js';
import Hearing from '../src/local-hearing.js';
import now from '../src/now.js';
import sqliteHelper from './sqlite-helper.js';
import sqlsrvHelper from './sqlsrv-helper.js';

const data1 = sqliteHelper.generateHearings([1, 2, 3, 4]);
const data2 = sqliteHelper.generateHearings([5, 6, 7]);

const pushJob = PushJob.create('test');
const scrapeJob = ScrapeJob.create('test');
const hearing = Hearing.create('test');

describe('pushHearings', () => {
  beforeEach(() => {
    pushJob.deleteAll(); 
    scrapeJob.deleteAllJobs(); 
  });

  describe('with invalid arguments', () => {
    let r;

    it('throws an exception', async () => {
      try {
        await pushHearings(null);
      }
      catch (e) {
        expect(e).to.equal('Specify Year');
      }
    });
  });

  describe('with unprocessed data', () => {
    let r;
    let job1, job2;
    let stub1, stub2;
    const ts1 = now();
    const ts2 = ts1 + 1001;
    const ts3 = ts1 + 2002;

    beforeEach(async () => {
      await sqlsrvHelper.deleteAllHearings();
      await hearing.deleteAll();
      r = await scrapeJob.insertJob(2, 4, 5, 5, 1, ts1); 
      job1 = r.lastInsertRowid;
      r = await scrapeJob.insertJob(2, 4, 6, 6, 1, ts3); 
      job2 = r.lastInsertRowid;
      r = await pushJob.insert(2, job1, 4, 5, 5, ts2);
      r = await hearing.bulkInsert(data1, ts2)
      r = await hearing.bulkInsert(data2, ts3)
    });

    it('push data to database', async () => {
      r = await pushHearings(2020);
      expect(r.msg).to.equal('Processed 3 Data');

      r = await sqlsrvHelper.countHearings();
      expect(r).to.equal(3);

      r = await sqlsrvHelper.selectHearings();
      expect(r.map((e) => e.measureNumber)).to.eql([5, 6, 7]);
      expect(r.map((e) => e.notice)).to.eql(['NOTICE5', 'NOTICE6', 'NOTICE7']);
      expect(r.map((e) => e.description)).to.eql(['DESCRIPTION5', 'DESCRIPTION6', 'DESCRIPTION7']);

      r = pushJob.selectAll()[1];
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(job2);
      expect(r.status).to.equal(4);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
    });
  });

  describe('with no unprocessed data', () => {
    let r;
    let job1, job2;

    beforeEach(() => {
      hearing.deleteAll();
      r = scrapeJob.insertJob(2, 4, 5, 5, 1); 
      job1 = r.lastInsertRowid;
      r = scrapeJob.insertJob(2, 4, 6, 6, 1); 
      job2 = r.lastInsertRowid;
      pushJob.insert(2, job1, 4, 5, 5);
    });

    it('returns error message', async () => {
      r = await pushHearings(2020);
      expect(r.msg).to.equal('No Unprocessed Data');
      r = await pushJob.selectAll()[1];
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(job2);
      expect(r.status).to.equal(2);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
    });
  });

  describe('with no unprocessed jobs', () => {
    let r;

    it('returns error message', async () => {
      r = await pushHearings(2020);
      expect(r.msg).to.equal('No Unprocessed Jobs');
      r = await pushJob.selectOne();
      expect(r.startedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(0);
      expect(r.dataType).to.equal(2);
      expect(r.status).to.equal(2);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
    });
  });

  describe('when an exception throws', () => {
    let r;
    let stub1, stub2;

    beforeEach(() => {
      stub1 = sinon.stub(pushJob, 'selectLastProcessedScrapeJobId').throws('Unexpected Error');
      stub2 = sinon.stub(PushJob, 'create').returns(pushJob);
    });

    afterEach(() => {
      stub1.restore();
      stub2.restore();
    });

    it('returns error message', async () => {
      r = await pushHearings(2020);
      expect(r.msg).to.equal('Unexpected Error');
      r = await pushJob.selectOne();
      expect(r.startedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(0);
      expect(r.dataType).to.equal(2);
      expect(r.status).to.equal(3);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
    });
  });
});

