
import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';

//import { fetchSpMeasures, getUrl } from '../src/fetch-sp-measures.js';
import SpMeasureScraper from '../src/sp-measure-scraper.js';
import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import SpMeasure from '../src/local-sp-measure.js';
import ScrapeJob from '../src/local-scrape-job.js';

const year = 9999;
const session = 'a';
const dir = 'test/data';
const testFile = './test/data/9999-spa.html';
const HTML = fs.readFileSync(testFile, "utf8");

const spBill = SpMeasure.create('test');
const scrapeJob = ScrapeJob.create('test');

describe('SpMeasureScraper#getUrl', () => {
  it('returns speciall session bill url', () => {
    const r = SpMeasureScraper.getUrl(2020, 'a');
    expect(r).to.equal('https://www.capitol.hawaii.gov/splsession.aspx?year=2020a');
  });
});

describe('SpMeasureScraper#scrapeOld', () => {
  const url = 'https://www.capitol.hawaii.gov/splsession.aspx?year=9999a';
  let fetchHtml;
  let isChanged;
  let save;

  beforeEach(async () => {
    await scrapeJob.deleteAllDetails(); 
    await scrapeJob.deleteAllJobs(); 
  });

  context('when fetch fails', () => {
    beforeEach(() => {
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').throws();
    });

    afterEach(() => {
      fetchHtml.restore();
    });

    it('returns failed as the message', async () => {
      let r = await SpMeasureScraper.scrapeOld(year, session, dir);
      expect(r).to.eql({ msg: 'failed', total: 0, updated: 0 });
      expect(fetchHtml.calledWith(url)).to.be.true;

      r = await scrapeJob.selectOneJob(); 
      expect(r.dataType).to.equal(3);
      expect(r.status).to.equal(3);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);
      r = await scrapeJob.countDetails(); 
      expect(r['COUNT(*)']).to.equal(0);
    });
  });

  context('when the fetched page is updated', () => {
    beforeEach(async () => {
      await spBill.deleteAll();
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').returns(HTML);
      isChanged = sinon.stub(LocalFile, 'isChanged').returns(true);
      save = sinon.stub(LocalFile, 'save');
    });

    afterEach(() => {
      fetchHtml.restore();
      isChanged.restore();
      save.restore();
    });

    it('returns completed as the message', async () => {
      let r = await SpMeasureScraper.scrapeOld(year, session, dir);
      expect(r).to.eql({ msg: 'completed', total: 3, updated: 3 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'spa', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'spa', dir)).to.be.true;

      r = await spBill.count();
      expect(r['COUNT(*)']).to.equal(3);

      r = await scrapeJob.selectOneJob(); 
      const jobId = r.id;
      expect(r.dataType).to.equal(3);
      expect(r.status).to.equal(4);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
      expect(r.updateNeeded).to.equal(1);

      r = await scrapeJob.countDetails(); 
      expect(r['COUNT(*)']).to.equal(1);

      r = await scrapeJob.selectOneDetail(); 
      expect(r.scrapeJobId).to.equal(jobId);
      expect(r.measureType).to.equal(9);
      expect(r.status).to.equal(4);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
    });
  });

  context('when the fetched page is not updated', () => {
    beforeEach(() => {
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').returns(HTML);
      isChanged = sinon.stub(LocalFile, 'isChanged').returns(false);
      save = sinon.stub(LocalFile, 'save');
    });

    afterEach(() => {
      fetchHtml.restore();
      isChanged.restore();
      save.restore();
    });

    it('returns skipped as the message', async () => {
      let r = await SpMeasureScraper.scrapeOld(year, session, dir);
      expect(r).to.eql({ msg: 'skipped', total: 0, updated: 0 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'spa', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'spa', dir)).to.be.false;

      r = await scrapeJob.selectOneJob(); 
      expect(r.dataType).to.equal(3);
      expect(r.status).to.equal(2);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);

      r = await scrapeJob.countDetails(); 
      expect(r['COUNT(*)']).to.equal(0);
    });
  });
});

describe('SpMeasureScraper#scrape', () => {
  const url = 'https://www.capitol.hawaii.gov/splsession.aspx?year=9999a';
  let fetchHtml;
  let isChanged;
  let save;

  context('when the fetched page is updated', () => {
    beforeEach(async () => {
      await spBill.deleteAll();
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').returns(HTML);
      isChanged = sinon.stub(LocalFile, 'isChanged').returns(true);
      save = sinon.stub(LocalFile, 'save');
    });

    afterEach(() => {
      fetchHtml.restore();
      isChanged.restore();
      save.restore();
    });

    it('returns completed as the message', async () => {
      let r = await SpMeasureScraper.scrape(year, session, dir);
      expect(r).to.eql({ msg: 'completed', total: 3, updated: 3 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'spa', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'spa', dir)).to.be.true;

      r = await spBill.count();
      expect(r['COUNT(*)']).to.equal(3);
    });
  });

  context('when the fetched page is not updated', () => {
    beforeEach(() => {
      fetchHtml = sinon.stub(Fetcher, 'fetchHtml').returns(HTML);
      isChanged = sinon.stub(LocalFile, 'isChanged').returns(false);
      save = sinon.stub(LocalFile, 'save');
    });

    afterEach(() => {
      fetchHtml.restore();
      isChanged.restore();
      save.restore();
    });

    it('returns skipped as the message', async () => {
      let r = await SpMeasureScraper.scrape(year, session, dir);
      expect(r).to.eql({ msg: 'skipped', total: 0, updated: 0 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'spa', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'spa', dir)).to.be.false;
    });
  });
});

describe('SpMeasureScraper#run', () => {
  let fakeScrape;

  beforeEach(async () => {
    await scrapeJob.deleteAllJobs(); 
  });

  context('when fetch fails', () => {
    beforeEach(() => {
      fakeScrape = sinon.stub(SpMeasureScraper, 'scrape').throws();
    });

    afterEach(() => {
      fakeScrape.restore();
    });

    it('returns failed as the message', async () => {
      let r = await SpMeasureScraper.run(year, session, dir);
      expect(r).to.eql({ msg: 'failed', total: 0, updated: 0 });
      expect(fakeScrape.calledWith(year, 'a', dir)).to.be.true;

      r = await scrapeJob.selectOneJob(); 
      expect(r.dataType).to.equal(3);
      expect(r.status).to.equal(3);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);
    });
  });

  context('when the fetched page is updated', () => {
    beforeEach(async () => {
      fakeScrape = sinon.stub(SpMeasureScraper, 'scrape');
      fakeScrape.returns({ msg: 'completed', total: 3, updated: 3 });
    });

    afterEach(() => {
      fakeScrape.restore();
    });

    it('returns completed as the message', async () => {
      let r = await SpMeasureScraper.run(year, session, dir);
      expect(r).to.eql({ msg: 'completed', total: 3, updated: 3 });
      expect(fakeScrape.calledWith(year, 'a', dir)).to.be.true;

      r = await scrapeJob.selectOneJob(); 
      const jobId = r.id;
      expect(r.dataType).to.equal(3);
      expect(r.status).to.equal(4);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
      expect(r.updateNeeded).to.equal(1);
    });
  });

  context('when the fetched page is not updated', () => {
    beforeEach(async () => {
      fakeScrape = sinon.stub(SpMeasureScraper, 'scrape');
      fakeScrape.returns({ msg: 'skipped', total: 0, updated: 0 });
    });

    afterEach(() => {
      fakeScrape.restore();
    });

    it('returns completed as the message', async () => {
      let r = await SpMeasureScraper.run(year, session, dir);
      expect(r).to.eql({ msg: 'skipped', total: 0, updated: 0 });
      expect(fakeScrape.calledWith(year, 'a', dir)).to.be.true;

      r = await scrapeJob.selectOneJob(); 
      const jobId = r.id;
      expect(r.dataType).to.equal(3);
      expect(r.status).to.equal(2);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);
    });
  });
});

