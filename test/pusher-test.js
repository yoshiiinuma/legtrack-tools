
import { expect } from 'chai';
import sinon from 'sinon';

import Pusher from '../src/pusher.js';
import PushHelper from '../src/push-helper.js';
import PushJob from '../src/local-push-job.js';
import LocalMeasure from '../src/local-measure.js';
import RemoteMeasure from '../src/remote-measure.js';
import LocalSpMeasure from '../src/local-sp-measure.js';
import RemoteSpMeasure from '../src/remote-sp-measure.js';
import LocalHearing from '../src/local-hearing.js';
import RemoteHearing from '../src/remote-hearing.js';
import now from '../src/now.js';
import sqliteHelper from './sqlite-helper.js';
import sqlsrvHelper from './sqlsrv-helper.js';

const pushJob = PushJob.create('test');

const ts1 = now();
const ts2 = ts1 + 1001;

describe('Pusher#create', () => {
  context('with invalid type given', () => {
    const local = LocalMeasure.create('test');
    const remote = RemoteMeasure.create('test');

    it('throws error', () => {
      try {
        const pusher = Pusher.create('XXX', local, remote, 'test');
      } catch (e) {
        expect(e.toString()).to.equal('Error: Unsupported Data Type: XXX');
      }
    });
  });
});

describe('Pusher#push', () => {
  context('when maxRecordsPerPush is 3', () => {
    const local = LocalMeasure.create('test');
    const remote = RemoteMeasure.create('test');
    const data1 = sqliteHelper.generateBills([1, 2, 3, 4, 5, 6, 7, 8]);
    let pusher, stub1;

    beforeEach(async () => {
      await local.deleteAll();
      await local.bulkInsert(data1, ts1);
      stub1 = sinon.stub(remote, 'push');
      stub1.onCall(0).returns({ rowsAffected: [3] });
      stub1.onCall(1).returns({ rowsAffected: [3] });
      stub1.onCall(2).returns({ rowsAffected: [2] });
      pusher = Pusher.create('MEASURE', local, remote, 'test');
    });
    
    afterEach(() => {
      stub1.restore();
    });

    it('pushes data chunk 3 times', async () => {
      const r = await pusher.push(ts1);

      expect(r).to.eql({ msg: 'Push Completed 8 / 8 Data', size: 8, rowsAffected: 8 });
      expect(stub1.getCall(0).firstArg.map(e => e.measureNumber)).to.eql([1, 2, 3]);
      expect(stub1.getCall(1).firstArg.map(e => e.measureNumber)).to.eql([4, 5, 6]);
      expect(stub1.getCall(2).firstArg.map(e => e.measureNumber)).to.eql([7, 8]);
    })
  });

  context('with Hearing models given', () => {
    const local = LocalHearing.create('test');
    const remote = RemoteHearing.create('test');
    const pusher = Pusher.create('HEARING', local, remote, 'test');
    const data1 = sqliteHelper.generateHearings([1, 2, 3, 4]);
    const data2 = sqliteHelper.generateHearings([5, 6, 7]);

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
        await sqlsrvHelper.deleteAllHearings();
        await local.deleteAll();
        r = await local.bulkInsert(data1, ts1)
        r = await local.bulkInsert(data2, ts2)
      });

      it('push data updated after specified time', async () => {
        r = await pusher.push(ts2);
        expect(r.msg).to.equal('Push Completed 3 / 3 Data');
        expect(r.size).to.equal(3);
        expect(r.rowsAffected).to.equal(3);

        r = await sqlsrvHelper.countHearings();
        expect(r).to.equal(3);

        r = await sqlsrvHelper.selectHearings();
        expect(r.map((e) => e.measureNumber)).to.eql([5, 6, 7]);
        expect(r.map((e) => e.notice)).to.eql(['NOTICE5', 'NOTICE6', 'NOTICE7']);
        expect(r.map((e) => e.description)).to.eql(['DESCRIPTION5', 'DESCRIPTION6', 'DESCRIPTION7']);
      });
    });

    describe('with no unprocessed data', () => {
      let r;

      beforeEach(async () => {
        await sqlsrvHelper.deleteAllHearings();
        await local.deleteAll();
      });

      it('push data updated after specified time', async () => {
        r = await pusher.push(ts1);
        expect(r).to.eql({ msg: 'No Unprocessed Data', skipped: true });
      });
    });
  });

  context('with Measure models given', () => {
    const local = LocalMeasure.create('test');
    const remote = RemoteMeasure.create('test');
    const pusher = Pusher.create('MEASURE', local, remote, 'test');
    const data1 = sqliteHelper.generateBills([1, 2, 3, 4]);
    const data2 = sqliteHelper.generateBills([5, 6, 7]);

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
        await local.deleteAll();
        r = await local.bulkInsert(data1, ts1)
        r = await local.bulkInsert(data2, ts2)
      });

      it('push data updated after specified time', async () => {
        r = await pusher.push(ts2);
        expect(r.msg).to.equal('Push Completed 3 / 3 Data');
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
        await local.deleteAll();
      });

      it('push data updated after specified time', async () => {
        r = await pusher.push(ts1);
        expect(r).to.eql({ msg: 'No Unprocessed Data', skipped: true });
      });
    });
  });

  context('with SpMeasure models given', () => {
    const local = LocalSpMeasure.create('test');
    const remote = RemoteSpMeasure.create('test');
    const pusher = Pusher.create('SP_MEASURE', local, remote, 'test');
    const data1 = sqliteHelper.generateSpBills([1, 2, 3, 4]);
    const data2 = sqliteHelper.generateSpBills([5, 6, 7]);

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
        await sqlsrvHelper.deleteAllSpBills();
        await local.deleteAll();
        r = await local.bulkInsert(data1, ts1)
        r = await local.bulkInsert(data2, ts2)
      });

      it('push data updated after specified time', async () => {
        r = await pusher.push(ts2);
        expect(r.msg).to.equal('Push Completed 3 / 3 Data');
        expect(r.size).to.equal(3);
        expect(r.rowsAffected).to.equal(3);

        r = await sqlsrvHelper.countSpBills();
        expect(r).to.equal(3);

        r = await sqlsrvHelper.selectSpBills();
        expect(r.map((e) => e.measureNumber)).to.eql([5, 6, 7]);
        expect(r.map((e) => e.reportTitle)).to.eql(['REPORT5', 'REPORT6', 'REPORT7']);
        expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE5', 'MEASURE6', 'MEASURE7']);
      });
    });

    describe('with no unprocessed data', () => {
      let r;

      beforeEach(async () => {
        await sqlsrvHelper.deleteAllSpBills();
        await local.deleteAll();
      });

      it('push data updated after specified time', async () => {
        r = await pusher.push(ts1);
        expect(r).to.eql({ msg: 'No Unprocessed Data', skipped: true });
      });
    });
  });
});

describe('Pusher#run', () => {
  const local = LocalMeasure.create('test');
  const remote = RemoteMeasure.create('test');
  const pusher = Pusher.create('MEASURE', local, remote, 'test');
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
    const pushRslt = { msg: 'Push Completed 3 / 3 Data', size: 3, rowAffected: 3 };

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

