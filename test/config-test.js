
import { expect } from 'chai';

import conf from '../src/config.js';

describe('Config#filepath', () => {
  it('returns the config file path', () => {
    const r = conf.filepath('sample');
    expect(r).to.be.equal('./config/sample.json');
  });
});

describe('Config#exists', () => {
  context('if a config file exists', () => {
    it('returns true', () => {
      expect(conf.exists('sample')).to.be.true;
    });
  });

  context('if a config file dest not exist', () => {
    it('returns false', () => {
      expect(conf.exists('xxx')).to.be.false;
    });
  });
});

describe('Config#load', () => {
  context('if a config file exists', () => {
    it('returns config object', () => {
      expect(conf.load('sample')).to.eql({
        "server": "SQL-SERVER-HOST",
        "database": "SQL-SERVER-DATABASE-NAME",
        "user": "SQL-SERVER-USER",
        "password": "SQL-SERVER-PASSWORD",
        "resultDir": "./PATH/TO/RESULT-DIR",
        "localDB": "SQLITE-DATABASE-FILENAME",
        "logFile": "./PATH/TO/LOGFILE",
        "logLevel": "{error|warn|info|debug}"
      })
    });
  });

  context('if a config file does not exist', () => {
    it('throws an error', () => {
      expect(() => { conf.load('xxx') }).to.throw(Error, /Config File Not Exist/);
    });
  });
});
