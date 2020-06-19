
import { expect } from 'chai';

import SqlsrvClient from '../src/sql-server-client.js';
import config from '../src/config.js';

const conf = config.load('test');

const SQLSEL = 'SELECT year,spSessionId,measureType,measureNumber FROM spMeasures';
const SQLCNT = 'SELECT COUNT(*) from spMeasures';
const SQLDEL = 'DELETE FROM spMeasures';
const SQLINS =
  `INSERT INTO spMeasures (year, spSessionId, measureType, measureNumber)
   VALUES (2020, 'a', 'hb', 1),  
          (2020, 'a', 'hb', 2),  
          (2020, 'a', 'hb', 3)`;

describe('SqlsrvClient#query', () => {
  const client = SqlsrvClient.create(conf);
  let r;

  it('runs queries', async () => {
    r = await client.query(SQLDEL);
    r = await client.query(SQLCNT);
    expect(r.recordset.pop()).to.be.eql({ '': 0 });
    r = await client.query(SQLINS);
    expect(r.rowsAffected.pop()).to.be.equal(3);
    r = await client.query(SQLCNT);
    expect(r.recordset.pop()).to.be.eql({ '': 3 });
    r = await client.query(SQLDEL);
    expect(r.rowsAffected.pop()).to.be.equal(3);
  });
});

describe('SqlsrvClient#batch', () => {
  const client = SqlsrvClient.create(conf);
  let r;

  it('runs queries', async () => {
    r = await client.batch(SQLDEL);
    r = await client.batch(SQLCNT);
    expect(r.recordset.pop()).to.be.eql({ '': 0 });
    r = await client.batch(SQLINS);
    expect(r.rowsAffected.pop()).to.be.equal(3);
    r = await client.batch(SQLCNT);
    expect(r.recordset.pop()).to.be.eql({ '': 3 });
    r = await client.batch(SQLDEL);
    expect(r.rowsAffected.pop()).to.be.equal(3);
  });
});
