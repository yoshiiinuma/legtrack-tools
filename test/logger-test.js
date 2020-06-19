
import { expect } from 'chai';
import sinon from 'sinon';
import SimpleNodeLogger from 'simple-node-logger';

import { LoggerHelper } from '../src/logger.js';

describe('LoggerHelper#getOptions', () => {
  it('returns options extracted from config', () => {
    const r = LoggerHelper.getOptions('test');
    expect(r).to.eql({
      level: 'debug',
      logFilePath: './logs/test.log',
      timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
    });
  });
});

describe('LoggerHelper#initLogger', () => {
  let spy1, spy2;

  beforeEach(() => {
    spy1 = sinon.spy(SimpleNodeLogger, 'createSimpleFileLogger');
    spy2 = sinon.spy(SimpleNodeLogger, 'createSimpleLogger');
  });

  afterEach(() => {
    spy1.restore();
    spy2.restore();
  });

  context('when logFilePath is passed', () => {
    it('calls SimpleNodeLogger#createSimpleFileLogger', () => {
      const opts = { logFilePath: './logs/test.log' };
      LoggerHelper.initLogger(opts);
      expect(spy1.calledOnce).to.be.true;
      expect(spy1.calledWith(opts)).to.be.true;
      expect(spy2.calledOnce).to.be.false;
    });
  });

  context('when logFilePath is not passed', () => {
    it('calls SimpleNodeLogger#createSimpleLogger', () => {
      const opts = { level: 'debug' };
      LoggerHelper.initLogger(opts);
      expect(spy1.calledOnce).to.be.false;
      expect(spy2.calledOnce).to.be.true;
      expect(spy2.calledWith(opts)).to.be.true;
    });
  });
});

describe('LoggerHelper#getLogger', () => {
  it('calls initLogger only once', () => {
  });
});
