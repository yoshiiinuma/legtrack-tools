
import mocha from 'mocha';
import { expect } from 'chai';

import { fetchMeasures, getUrl } from '../src/fetch-measures.js';

const dir = 'test/data';
const year = 2020;


describe('getUrl', () => {
  let r;

  it('returns the url of capitol deadline tracking page for each measure', () => {
    r = getUrl(2020, 'hb');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&active=true&rpt_type=&measuretype=hb');
    r = getUrl(2020, 'sb');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&active=true&rpt_type=&measuretype=sb');
    r = getUrl(2020, 'hr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=hr');
    r = getUrl(2020, 'sr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=sr');
    r = getUrl(2020, 'hcr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=hcr');
    r = getUrl(2020, 'scr');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=scr');
    r = getUrl(2020, 'gm');
    expect(r).to.equal('http://capitol.hawaii.gov/advreports/advreport.aspx?year=2020&report=deadline&rpt_type=&measuretype=gm');
  });
});

describe('fetcpMeasures', () => {
  it('returns failed as the message', async () => {
    //let r = await fetchMeasures(year, 'hb', dir);
  }).timeout(10000);
});

