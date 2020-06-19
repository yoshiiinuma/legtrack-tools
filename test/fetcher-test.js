
import { expect } from 'chai';
import fs from 'fs';
import util from 'util';

import { fetchSimple, fetchHtml, fetchAndSave } from '../src/fetcher.js';

const URL = "https://google.com" 

describe('fetchSimple', () => {
  context('with undefined given as url', () => {
    it('returns error message', async () => {
      let err = null;
      await fetchSimple().catch((e) => err = e);
      expect(err).not.to.null;
      expect(err.message).to.equal('FetchSimple: No URL Provided');
    });
  });

  context('with null given as url', () => {
    it('returns error message', async () => {
      let err = null;
      await fetchSimple(null).catch((e) => err = e);
      expect(err).not.to.null;
      expect(err.message).to.equal('FetchSimple: No URL Provided');
    });
  });

  context('with empty string given as url', () => {
    it('returns error message', async () => {
      let err = null;
      await fetchSimple('').catch((e) => err = e);
      expect(err).not.to.null;
      expect(err.message).to.equal('FetchSimple: No URL Provided');
    });
  });
});

describe('fetchHtml', () => {
  it('returns the requested page', async () => {
    const html = await fetchHtml(URL);
    expect(html).to.not.be.null;
  });
});

describe('fetchAndSave', () => {
  context('given a valid path', () => {
    const dst = "./test/data/fetched.html"
    it('saves a requested page', async () => {
      const rslt = await fetchAndSave(URL, dst);
      expect(rslt).to.equal(dst);
      expect(fs.existsSync(dst)).to.true;
      fs.unlinkSync(dst); 
    });
  });

  context('given an invalid path', () => {
    const dst = "./test/xxxxxx/fetched.html"
    it('saves a requested page', async () => {
      let err;
      await fetchAndSave(URL, dst).catch((e) => err = e);
      expect(err instanceof Error).to.be.true;
    });
  });
});
