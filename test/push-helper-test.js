
import { expect } from 'chai';

import PushHelper from '../src/push-helper.js';
import ScrapeJob from '../src/local-scrape-job.js';
import PushJob from '../src/local-push-job.js';
import now from '../src/now.js';

const scrapeJob = ScrapeJob.create('test');
const pushJob = PushJob.create('test');

const dataType = 1;

describe('PushHelper#getUnprocessedScrapeJob', () => {
  let r;

  beforeEach(() => {
    scrapeJob.deleteAllJobs(); 
    pushJob.deleteAll(); 
  });

  context('with no push jobs', () => {
    it('returns null', async () => {
      r = await PushHelper.getUnprocessedScrapeJob(pushJob, dataType);
      expect(r).to.be.null;
    });
  });

  context('with no scrape jobs', () => {
    const ts1 = now();
    const ts2 = ts1 + 1001;
    const ts3 = ts1 + 2002;
    let job1, job2;

    beforeEach(async () => {
      r = await scrapeJob.insertJob(dataType, 4, 5, 5, 1, ts1); 
      job1 = r.lastInsertRowid;
      r = await pushJob.insert(dataType, job1, 4, 5, 5, ts2);
    });

    it('returns null', async () => {
      r = await PushHelper.getUnprocessedScrapeJob(pushJob, 1);
      expect(r).to.be.null;
    });
  });

  context('with scrape job', () => {
    const ts1 = now();
    const ts2 = ts1 + 1001;
    const ts3 = ts1 + 2002;
    let job1, job2;

    beforeEach(async () => {
      r = await scrapeJob.insertJob(dataType, 4, 5, 5, 1, ts1); 
      job1 = r.lastInsertRowid;
      r = await scrapeJob.insertJob(dataType, 4, 6, 6, 1, ts3); 
      job2 = r.lastInsertRowid;
      r = await pushJob.insert(dataType, job1, 4, 5, 5, ts2);
    });

    it('returns null', async () => {
      r = await PushHelper.getUnprocessedScrapeJob(pushJob, 1);
      expect(r.id).to.be.above(0);
      expect(r.startedAt).to.be.above(0);
    });
  });

});

