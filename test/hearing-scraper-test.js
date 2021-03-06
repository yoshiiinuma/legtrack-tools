
import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';

import Scraper from '../src/hearing-scraper.js';
import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import Hearing from '../src/local-hearing.js';
import ScrapeJob from '../src/local-scrape-job.js';

const dir = 'test/data';
const year = 9999;
const testFile = './test/data/9999-hearings.html';
const HTML = fs.readFileSync(testFile, "utf8");

const hearing = Hearing.create('test');
const scrapeJob = ScrapeJob.create('test');

describe('HearingScraper#scrape', () => {
  let fetchHtml;
  let isChanged;
  let save;
  const url = 'https://www.capitol.hawaii.gov/upcominghearings.aspx';

  context('when the fetched page is updated', () => {
    before(async () => {
      await hearing.deleteAll();
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
      let r = await Scraper.scrape(year, dir);
      expect(r).to.eql({ msg: 'completed', total: 3, updated: 3 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'hearings', dir)).to.be.true;
      expect(save.calledWith(HTML, year, 'hearings', dir)).to.be.true;

      r = await hearing.count();
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
      let r = await Scraper.scrape(year, dir);
      expect(r).to.eql({ msg: 'skipped', total: 0, updated: 0 });
      expect(fetchHtml.calledWith(url)).to.be.true;
      expect(isChanged.calledWith(HTML, year, 'hearings', dir)).to.be.true;
      expect(save.called).to.be.false;
    });
  });
});

describe('HearingScraper#run', () => {
  let fakeScrape;

  beforeEach(async () => {
    await scrapeJob.deleteAllDetails();
    await scrapeJob.deleteAllJobs();
  });

  context('when fetch fails', () => {
    before(() => {
      fakeScrape = sinon.stub(Scraper, 'scrape').throws();
    });

    after(() => {
      fakeScrape.restore();
    });

    it('returns failed as the message', async () => {
      let r = await Scraper.run(year, dir);
      expect(r).to.eql({ msg: 'failed', total: 0, updated: 0 });
      expect(fakeScrape.calledWith(year, dir)).to.be.true;

      r = await scrapeJob.selectOneJob();
      expect(r.dataType).to.equal(2);
      expect(r.status).to.equal(3);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);
    });
  });

  context('when the fetched page is updated', () => {
    before(async () => {
      fakeScrape = sinon.stub(Scraper, 'scrape');
      fakeScrape.returns({ msg: 'completed', total: 3, updated: 3 });
    });

    after(() => {
      fakeScrape.restore();
    });

    it('returns completed as the message', async () => {
      let r = await Scraper.run(year, dir);
      expect(r).to.eql({ msg: 'completed', total: 3, updated: 3 });
      expect(fakeScrape.calledWith(year, dir)).to.be.true;

      r = await scrapeJob.selectOneJob();
      const jobId = r.id;
      expect(r.dataType).to.equal(2);
      expect(r.status).to.equal(4);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(3);
      expect(r.updatedNumber).to.equal(3);
      expect(r.updateNeeded).to.equal(1);
    });
  });

  context('when the fetched page is not updated', () => {
    before(() => {
      fakeScrape = sinon.stub(Scraper, 'scrape');
      fakeScrape.returns({ msg: 'skipped', total: 0, updated: 0 });
    });

    after(() => {
      fakeScrape.restore();
    });

    it('returns skipped as the message', async () => {
      let r = await Scraper.run(year, dir);
      expect(r).to.eql({ msg: 'skipped', total: 0, updated: 0 });
      expect(fakeScrape.calledWith(year, dir)).to.be.true;

      r = await scrapeJob.selectOneJob();
      expect(r.dataType).to.equal(2);
      expect(r.status).to.equal(2);
      expect(r.startedAt).to.be.above(0);
      expect(r.completedAt).to.be.above(0);
      expect(r.totalNumber).to.equal(0);
      expect(r.updatedNumber).to.equal(0);
      expect(r.updateNeeded).to.equal(0);
    });
  });
});

