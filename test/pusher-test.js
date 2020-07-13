
import { expect } from 'chai';
import sinon from 'sinon';

import Pusher from '../src/pusher.js';
import PushHelper from '../src/push-helper.js';
import PushJob from '../src/local-push-job.js';
import LocalMeasure from '../src/local-measure.js';
import RemoteMeasure from '../src/remote-measure.js';
import now from '../src/now.js';
import sqliteHelper from './sqlite-helper.js';
import sqlsrvHelper from './sqlsrv-helper.js';

const data1 = sqliteHelper.generateBills([1, 2, 3, 4]);
const data2 = sqliteHelper.generateBills([5, 6, 7]);

const pushJob = PushJob.create('test');
const localMeasure = LocalMeasure.create('test');
const remoteMeasure = RemoteMeasure.create('test');

const ts1 = now();
const ts2 = ts1 + 1001;

describe('Pusher#create', () => {
  context('with invalid type given', () => {
    it('throws error', () => {
      try {
        const pusher = Pusher.create('XXX', localMeasure, remoteMeasure, 'test');
      } catch (e) {
        expect(e.toString()).to.equal('Error: Unsupported Data Type: XXX');
      }
    });
  });
});

describe('Pusher#push', () => {
  const pusher = Pusher.create('MEASURE', localMeasure, remoteMeasure, 'test');

  describe('with no time given', () => {
    it('throws an exception', async () => {
      try {
        await pusher.push(null);
      }
      catch (e) {
        expect(e.toString()).to.equal('Error: Speficy Time to Select Data');
      }
    });
  });

  describe('with unprocessed data', () => {
    let r;

    beforeEach(async () => {
      await sqlsrvHelper.deleteAllBills();
      await localMeasure.deleteAll();
      r = await localMeasure.bulkInsert(data1, ts1)
      r = await localMeasure.bulkInsert(data2, ts2)
    });

    it('push data updated after specified time', async () => {
      r = await pusher.push(ts2);
      expect(r.msg).to.equal('Push Completed 3 Data');
      expect(r.size).to.equal(3);
      expect(r.rowsAffected).to.equal(3);

      r = await sqlsrvHelper.countBills();
      expect(r).to.equal(3);

      r = await sqlsrvHelper.selectBills();
      expect(r.map((e) => e.measureNumber)).to.eql([5, 6, 7]);
      expect(r.map((e) => e.reportTitle)).to.eql(['REPORT5', 'REPORT6', 'REPORT7']);
      expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE5', 'MEASURE6', 'MEASURE7']);
    });
  });

  describe('with no unprocessed data', () => {
    let r;

    beforeEach(async () => {
      await sqlsrvHelper.deleteAllBills();
      await localMeasure.deleteAll();
    });

    it('push data updated after specified time', async () => {
      r = await pusher.push(ts1);
      expect(r).to.eql({ msg: 'No Unprocessed Data', skipped: true });
    });
  });
});

describe('Pusher#run', () => {
  const pusher = Pusher.create('MEASURE', localMeasure, remoteMeasure, 'test');
  let r;
  let stub1, stub2;

  beforeEach(() => {
    pushJob.deleteAll(); 
  });

  describe('with no unprocessed jobs', () => {
    beforeEach(() => {
      stub1 = sinon.stub(PushHelper, 'getUnprocessedScrapeJob').returns(null);
    });

    afterEach(() => {
      stub1.restore();
    });

    it('returns error message', async () => {
      r = await pusher.run(2020);
      expect(r.msg).to.equal('No Unprocessed Scrape Jobs');
      expect(stub1.calledOnce).to.be.true;

      r = await pushJob.selectOne();
      expect(r.startedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(0);
      expect(r.dataType).to.equal(1);
      expect(r.status).to.equal(2);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
    });
  });

  describe('when an exception throws', () => {
    context('at getUnprocessedScrapeJob function', () => {
      beforeEach(() => {
        stub1 = sinon.stub(PushHelper, 'getUnprocessedScrapeJob').throws('Unexpected Error');
      });

      afterEach(() => {
        stub1.restore();
      });

      it('returns error message', async () => {
        r = await pusher.run(2020);
        expect(r.error).to.be.true;
        expect(r.msg).to.equal('Unexpected Error');
        expect(stub1.calledOnce).to.be.true;

        r = await pushJob.selectOne();
        expect(r.startedAt).to.be.above(0);
        expect(r.scrapeJobId).to.equal(0);
        expect(r.dataType).to.equal(1);
        expect(r.status).to.equal(3);
        expect(r.totalNumber).to.equal(0);
        expect(r.updatedNumber).to.equal(0);
      });
    });

    context('at push', () => {
      const unprocessedJob = { id: 123, startedAt: ts2 };

      beforeEach(() => {
        stub1 = sinon.stub(PushHelper, 'getUnprocessedScrapeJob').returns(unprocessedJob);
        stub2 = sinon.stub(pusher, 'push').throws('Unexpected Error');
      });

      afterEach(() => {
        stub1.restore();
        stub2.restore();
      });

      it('returns error message', async () => {
        r = await pusher.run(2020);
        expect(r.error).to.be.true;
        expect(r.msg).to.equal('Unexpected Error');
        expect(stub1.calledOnce).to.be.true;
        expect(stub2.calledWith(ts2)).to.be.true;

        r = await pushJob.selectOne();
        expect(r.startedAt).to.be.above(0);
        expect(r.scrapeJobId).to.equal(123);
        expect(r.dataType).to.equal(1);
        expect(r.status).to.equal(3);
        expect(r.totalNumber).to.equal(0);
        expect(r.updatedNumber).to.equal(0);
      });
    });
  });

  describe('with no unprocessed data', () => {
    const unprocessedJob = { id: 123, startedAt: ts2 };
    const pushRslt = { msg: 'No Unprocessed Data', skipped: true };

    beforeEach(() => {
      stub1 = sinon.stub(PushHelper, 'getUnprocessedScrapeJob').returns(unprocessedJob);
      stub2 = sinon.stub(pusher, 'push').returns(pushRslt);
    });

    afterEach(() => {
      stub1.restore();
      stub2.restore();
    });

    it('returns error message', async () => {
      r = await pusher.run(2020);
      expect(r.skipped).to.be.true;
      expect(r.msg).to.equal('No Unprocessed Data');
      expect(stub1.calledOnce).to.be.true;
      expect(stub2.calledWith(ts2)).to.be.true;

      r = await pushJob.selectOne();
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(123);
      expect(r.status).to.equal(2);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
    });
  });

  describe('with unprocessed data', () => {
    const unprocessedJob = { id: 123, startedAt: ts2 };
    const pushRslt = { msg: 'Push Completed 3 Data', size: 3, rowAffected: 3 };

    beforeEach(() => {
      stub1 = sinon.stub(PushHelper, 'getUnprocessedScrapeJob').returns(unprocessedJob);
      stub2 = sinon.stub(pusher, 'push').returns(pushRslt);
    });

    afterEach(() => {
      stub1.restore();
      stub2.restore();
    });

    it('returns error message', async () => {
      r = await pusher.run(2020);
      expect(r).to.eql(pushRslt);
      expect(stub1.calledOnce).to.be.true;
      expect(stub2.calledWith(ts2)).to.be.true;

      r = await pushJob.selectOne();
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.scrapeJobId).to.equal(123);
      expect(r.status).to.equal(4);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
    });
  });
});

