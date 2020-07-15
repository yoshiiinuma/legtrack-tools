
import { expect } from 'chai';
import fs from 'fs';
import $ from 'cheerio';

import SpMeasureParser from '../src/sp-measure-parser.js';

//const testFile1 = './test/data/spsession-2017.html';
//const testFile2 = './test/data/spsession-2018a.html';
//const testFile3 = './test/data/spsession-2018b.html';
//const testFile4 = './test/data/spsession-2019a.html';
//const testFile5 = './test/data/spsession-2019b.html';
//const testFile6 = './test/data/sp-bills.html';
const testFile = './test/data/9999-spa.html';
const HTML = fs.readFileSync(testFile, "utf8");

const TR = `<tr>
		<td width="25">
      <font face="Tahoma" color="#3A5078">
        <a id="ctl00_ContentPlaceHolderCol1_GridViewReports_ctl04_HyperLink2" href="http://www.capitol.hawaii.gov/aaaa/AAA.pdf" target="_blank">
          <img src="Images/pdf_icon.gif" alt border="0">
        </a>
      </font>
    </td>
    <td>
      <font face="Tahoma" color="Red">                                    
        <a id="ctl00_ContentPlaceHolderCol1_GridViewReports_ctl04_reportsStatusLink" href="/bbbb.aspx?billtype=SR&amp;billnumber=3&amp;year=2017a" target="_blank">
          <b><font color="Blue">CODE</font></b>
        </a>
      </font>
     </td>
     <td>
       <font face="Tahoma" color="#3A5078"><br>
         <span id="ctl00_ContentPlaceHolderCol1_GridViewReports_ctl04_Label1">
           <u><font size="2">REPORT TITLE</font></u>
         </span><br>
         <span id="ctl00_ContentPlaceHolderCol1_GridViewReports_ctl04_Label7">
           <font size="1">MEASURE TITLE</font>
         </span><br>
       </font>
      </td>
      <td>
        <font face="Tahoma" color="#3A5078">
          <span id="ctl00_ContentPlaceHolderCol1_GridViewReports_ctl04_Label9">
            <font size="1">REFERRAL</font></span>
          </font>
      </td>
    </tr>`;

describe('SpMeasureParser.parseAll', () => {
  it('extracts contents', () => {
    const r = SpMeasureParser.parseAll(HTML);
    expect(r.length).to.equal(3);
    expect(r.map(e => e.measureTypeOrig)).to.eql(['sr', 'sr', 'sr']);
    expect(r.map(e => e.measureType)).to.eql([4, 4, 4]);
    expect(r.map(e => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map(e => e.code)).to.eql(['SR1', 'SR2', 'SR3']);
  });
});

describe('SpMeasureParser.parse', () => {
  it('extracts contents', () => {
    const r = SpMeasureParser.parse($(TR));
    expect(r).to.eql({
      year: 2017,
      spSessionId: 'a',
      measureTypeOrig: 'sr',
      measureType: 4,
      measureNumber: 3,
      code: 'CODE',
      measurePdfUrl: 'http://www.capitol.hawaii.gov/aaaa/AAA.pdf',
      measureArchiveUrl: 'http://www.capitol.hawaii.gov/bbbb.aspx?billtype=SR&billnumber=3&year=2017a',
      reportTitle: 'REPORT TITLE',
      measureTitle: 'MEASURE TITLE',
      currentReferral: 'REFERRAL'
    });
  });
});

describe('SpMeasureParser.parseUrl', () => {
  it('extracts contents', () => {
    const url2 = '/measure_indivSS.aspx?billtype=SB&amp;billnumber=1&amp;year=2017a';
    const url = '/measure_indivSS.aspx?billtype=SR&billnumber=3&year=2017a';
    const r = SpMeasureParser.parseUrl(url);
    expect(r).to.eql({
      year: 2017,
      spSessionId: 'a',
      measureTypeOrig: 'sr',
      measureType: 4,
      measureNumber: 3
    });
  });
});
