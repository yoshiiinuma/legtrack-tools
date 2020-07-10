
import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';

import FetchMeasures from '../src/fetch-measures.js';
import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import Measure from '../src/local-measure.js';
import ScrapeJob from '../src/local-scrape-job.js';

const dir = 'test/data';
const year = 9999;
const testFile = './test/data/9999-hb.html';
const HTML = fs.readFileSync(testFile, "utf8");

const spBill = Measure.create('test');
const scrapeJob = ScrapeJob.create('test');

let fetchHtml;
let isChanged;
let save;

describe('getUrl', () => {
  let r;

  it('returns the url of capitol deadline tracking page for each measure', () => {
    r = FetchMeasures.getUrl(2020, 'hb');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&active=true&rpt_type=&measuretype=hb');
    r = FetchMeasures.getUrl(2020, 'sb');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&active=true&rpt_type=&measuretype=sb');
    r = FetchMeasures.getUrl(2020, 'hr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=hr');
    r = FetchMeasures.getUrl(2020, 'sr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=sr');
    r = FetchMeasures.getUrl(2020, 'hcr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=hcr');
    r = FetchMeasures.getUrl(2020, 'scr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=scr');
    r = FetchMeasures.getUrl(2020, 'gm');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=gm');
  });
});

describe('fetchMeasuresByType', () => {
  const url = 'http://capitol.hawaii.gov/advreports/advreport.aspx?year=9999&report=deadline&active=true&rpt_type=&measuretype=hb';

  context('when fetch fails', () => {
    before(() => {
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').throws();
    });

    after(() => {
      fetchHtml.restore();
    });

    it('returns failed as the message', async () => {
      let r = await FetchMeasures.fetchMeasuresByType(year, 'hb', dir);
      expect(r).to.eql({ msg: 'failed', total: 0, updated: 0 });
      expect(fetchHtml.calledWith(url)).to.be.true;
    });
  });

  context('when the fetched page is updated', () => {
    before(async () => {
      await spBill.deleteAll();
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').returns(HTML);
      isChanged = sinon.stub(LocalFile, 'isChanged').returns(true);
      save = sinon.stub(LocalFile, 'save');
    });

    after(() => {
      fetchHtml.restore();
      isChanged.restore();
      save.restore();
    });

    it('returns completed as the message', async () => {
      let r = await FetchMeasures.fetchMeasuresByType(year, 'hb', dir);
      expect(r).to.eql({ msg: 'completed', total: 3, updated: 3 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'hb', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'hb', dir)).to.be.true;

      r = await spBill.count();
      expect(r['COUNT(*)']).to.equal(3);
    });
  });

  context('when the fetched page is not updated', () => {
    before(() => {
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').returns(HTML);
      isChanged = sinon.stub(LocalFile, 'isChanged').returns(false);
      save = sinon.stub(LocalFile, 'save');
    });

    after(() => {
      fetchHtml.restore();
      isChanged.restore();
      save.restore();
    });

    it('returns skipped as the message', async () => {
      let r = await FetchMeasures.fetchMeasuresByType(year, 'hb', dir);
      expect(r).to.eql({ msg: 'skipped', total: 0, updated: 0 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'hb', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'hb', dir)).to.be.false;
    });
  });
});

describe('fetchAllMeasures', () => {
  let fakeFetch;

  beforeEach(async () => {
    await scrapeJob.deleteAllDetails(); 
    await scrapeJob.deleteAllJobs(); 
  });

  context('when all fetch returns failed', () => {
    before(() => {
      fakeFetch = sinon.stub(FetchMeasures, 'fetchMeasuresByType');
      fakeFetch.returns({ msg: 'failed', total: 0, updated: 0 });
    });

    after(() => {
      fakeFetch.restore();
    });

    it('returns failed as the message', async () => {
      let r = await FetchMeasures.fetchAllMeasures(year, dir);
      expect(r).to.eql({ msg: 'ERROR [HB,SB,HR,SR,HCR,SCR,GM]', total: 0, updated: 0 });

      r = await scrapeJob.selectOneJob(); 
      const jobId = r.id;
      expect(r.dataType).to.equal(1);
      expect(r.status).to.equal(3);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);

      r = await scrapeJob.countDetails(); 
      expect(r['COUNT(*)']).to.equal(7);

      r = await scrapeJob.selectAllDetails(); 
      for (let d of r) {
        expect(d.scrapeJobId).to.be.equal(jobId);
        expect(d.status).to.be.equal(3);
        expect(d.totalNumber).to.be.equal(0);
        expect(d.updatedNumber).to.be.equal(0);
      }
    });
  });

  context('when all fetch returns skipped', () => {
    before(() => {
      fakeFetch = sinon.stub(FetchMeasures, 'fetchMeasuresByType')
      fakeFetch.returns({ msg: 'skipped', total: 0, updated: 0 });
    });

    after(() => {
      fakeFetch.restore();
    });

    it('returns failed as the message', async () => {
      let r = await FetchMeasures.fetchAllMeasures(year, dir);
      expect(r).to.eql({ msg: 'No Measure Updated', total: 0, updated: 0 });

      r = await scrapeJob.selectOneJob(); 
      const jobId = r.id;
      expect(r.dataType).to.equal(1);
      expect(r.status).to.equal(2);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);

      r = await scrapeJob.countDetails(); 
      expect(r['COUNT(*)']).to.equal(7);

      r = await scrapeJob.selectAllDetails(); 
      for (let d of r) {
        expect(d.scrapeJobId).to.be.equal(jobId);
        expect(d.status).to.be.equal(2);
        expect(d.totalNumber).to.be.equal(0);
        expect(d.updatedNumber).to.be.equal(0);
      }
    });
  });

  context('when each fetch returns a different result', () => {
    before(() => {
      fakeFetch = sinon.stub(FetchMeasures, 'fetchMeasuresByType')
      fakeFetch.withArgs(year, 'hb', dir).returns({ msg: 'completed', total: 1, updated: 1 });
      fakeFetch.withArgs(year, 'sb', dir).returns({ msg: 'skipped', total: 0, updated: 0 });
      fakeFetch.withArgs(year, 'hr', dir).returns({ msg: 'completed', total: 2, updated: 2 });
      fakeFetch.withArgs(year, 'sr', dir).returns({ msg: 'skipped', total: 0, updated: 0 });
      fakeFetch.withArgs(year, 'hcr', dir).returns({ msg: 'completed', total: 3, updated: 3 });
      fakeFetch.withArgs(year, 'scr', dir).returns({ msg: 'failed', total: 0, updated: 0 });
      fakeFetch.withArgs(year, 'gm', dir).returns({ msg: 'skipped', total: 0, updated: 0 });
    });

    after(() => {
      fakeFetch.restore();
    });

    it('returns failed as the message', async () => {
      let r = await FetchMeasures.fetchAllMeasures(year, dir);
      expect(r).to.eql({ msg: 'UPDATED [HB,HR,HCR]; ERROR [SCR]', total: 6, updated: 6 });

      r = await scrapeJob.selectOneJob(); 
      const jobId = r.id;
      expect(r.dataType).to.equal(1);
      expect(r.status).to.equal(3);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(6);
      expect(r.updatedNumber).to.equal(6);
      expect(r.updateNeeded).to.equal(1);

      r = await scrapeJob.countDetails(); 
      expect(r['COUNT(*)']).to.equal(7);

      r = await scrapeJob.selectAllDetails(); 
      expect(r[0].scrapeJobId).to.be.equal(jobId);
      expect(r[0].status).to.be.equal(4);
      expect(r[0].totalNumber).to.be.equal(1);
      expect(r[0].updatedNumber).to.be.equal(1);
      expect(r[1].scrapeJobId).to.be.equal(jobId);
      expect(r[1].status).to.be.equal(2);
      expect(r[1].totalNumber).to.be.equal(0);
      expect(r[1].updatedNumber).to.be.equal(0);
      expect(r[2].scrapeJobId).to.be.equal(jobId);
      expect(r[2].status).to.be.equal(4);
      expect(r[2].totalNumber).to.be.equal(2);
      expect(r[2].updatedNumber).to.be.equal(2);
      expect(r[3].scrapeJobId).to.be.equal(jobId);
      expect(r[3].status).to.be.equal(2);
      expect(r[3].totalNumber).to.be.equal(0);
      expect(r[3].updatedNumber).to.be.equal(0);
      expect(r[4].scrapeJobId).to.be.equal(jobId);
      expect(r[4].status).to.be.equal(4);
      expect(r[4].totalNumber).to.be.equal(3);
      expect(r[4].updatedNumber).to.be.equal(3);
      expect(r[5].scrapeJobId).to.be.equal(jobId);
      expect(r[5].status).to.be.equal(3);
      expect(r[5].totalNumber).to.be.equal(0);
      expect(r[5].updatedNumber).to.be.equal(0);
      expect(r[6].scrapeJobId).to.be.equal(jobId);
      expect(r[6].status).to.be.equal(2);
      expect(r[6].totalNumber).to.be.equal(0);
      expect(r[6].updatedNumber).to.be.equal(0);
    });
  });
});
