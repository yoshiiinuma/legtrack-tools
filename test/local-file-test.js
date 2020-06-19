
import fs from 'fs';
import { expect } from 'chai';

import LocalFile from '../src/local-file.js';

const txt = 'Hello World!';
const txt2 = 'Hello USA!';
const expHash = 'ed076287532e86365e841e92bfc50d8c';
  
const year = 2015;
const type = 'sp';
const dir = 'test/data';
 
describe('LocalFile#md5', () => {
  it('returns the expected md5 hash of the given string', () => {
    expect(LocalFile.md5(txt)).to.equal(expHash);
  });
});

describe('LocalFile#filePath', () => {
  context('with dir param given', () => {
    it('returns the file path using dir', () => {
      expect(LocalFile.filePath(year, type, dir)).to.equal('test/data/2015-sp.html');
    });
  });

  context('without dir param', () => {
    it('returns the file path defined in config', () => {
      expect(LocalFile.filePath(year, type)).to.equal('results/2015-sp.html');
    });
  });
});

describe('LocalFile#load', () => {
  context('with existing file', () => {
    it('returns the content of the file', () => {
      LocalFile.save(txt, year, type, dir);
      const content = LocalFile.load(year, type, dir); 
      expect(content).to.equal(txt);
    });
  });

  context('with non-existent file', () => {
    it('returns null', () => {
      const content = LocalFile.load(9999, 'xx'); 
      expect(content).to.equal(null);
    });
  });
});

describe('LocalFile#save', () => {
  const dst = dir + '/2015-sp.html';

  it('saves given contents', () => {
      fs.unlinkSync(dst); 
      LocalFile.save(txt, year, type, dir);
      expect(fs.existsSync(dst)).to.true;
      const content = LocalFile.load(year, type, dir); 
      expect(content).to.equal(txt);
  });
});

describe('LocalFile#isChanged', () => {
  context('with existent file', () => {
    context('and the same content given', () => {
      it('returns false', () => {
        LocalFile.save(txt, year, type, dir);
        const r = LocalFile.isChanged(txt, year, type, dir); 
        expect(r).to.be.false;
      });
    });

    context('and a different content given', () => {
      it('returns true', () => {
        LocalFile.save(txt, year, type, dir);
        const r = LocalFile.isChanged(txt2, year, type, dir); 
        expect(r).to.be.true;
      });
    });
  });

  context('with non-existent file', () => {
    it('returns true', () => {
      const r = LocalFile.isChanged(txt, 9999, 'xx'); 
      expect(r).to.be.true;
    });
  });
});
