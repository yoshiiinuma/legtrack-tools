
import { expect } from 'chai';
import fs from 'fs';
import $ from 'cheerio';

import { parseBills, parseBill } from '../src/parse-measures.js';

//const testFile = './test/data/2018-hb.html';
const testFile = './test/data/2020-hb.html';
const HTML = fs.readFileSync(testFile, "utf8");

const TR = `<tr>
    <td width="25">
        <font face="Tahoma" color="#3A5078">
            <a id="GridViewReports_ctl02_HyperLink2" href="https://www.capitol.hawaii.gov/session2020/bills/HB35_HD1_.pdf" target="_blank"><img src="../Images/pdf_icon.gif" alt border="0"></a>
        </font>
    </td>
    <td>
        <font face="Tahoma" color="#3A5078">
            <a id="GridViewReports_ctl02_HyperLink1" class="report" href="https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=HB&amp;billnumber=35&amp;year=2020" target="_blank">HB35 HD1</a><br>
            <span id="GridViewReports_ctl02_Label1" class="hide"><u>
                    <font size="2">REPORT TITLE</font></u>
            </span>
            <span id="GridViewReports_ctl02_Label41">
                <font size="1">($)</font>
            </span><br>
            <span id="GridViewReports_ctl02_Label7">
                <font size="1">MEASURE TITLE</font>
            </span><br>
            <span id="GridViewReports_ctl02_Label2" class="hide">
                <font size="1">DESCRIPTION</font>
            </span>
         </font>
    </td>
    <td width="150">
        <font face="Tahoma" color="#3A5078">
            (<span id="GridViewReports_ctl02_Label3">
                <font size="1">S</font>
            </span>)
            <span id="GridViewReports_ctl02_Label5"><u>
                    <font size="1">3/13/2020</font>
                </u></span>- <span id="GridViewReports_ctl02_Label4">
                <font size="1">STATUS.</font>
            </span></font>
    </td>
    <td width="200">
        <font face="Tahoma" color="#3A5078">
            <span id="GridViewReports_ctl02_Label27">
                <font size="1">INTRODUCERS</font>
            </span></font>
    </td>
    <td>
        <font face="Tahoma" color="#3A5078">
            <span id="GridViewReports_ctl02_Label9">
                <font size="1">CURRENT REFERRAL</font>
            </span></font>
    </td>
    <td>
        <font face="Tahoma" color="#3A5078">
            <span id="GridViewReports_ctl02_Label6" style="display:inline-block;font-size:8pt;width:75px;">
                &nbsp;
                <a href="http://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=SB&amp;billnumber=965&amp;year=2020">COMPANION</a>
            </span></font>
    </td>
</tr>`;

const types = ['hb', 'sb', 'hr', 'sr', 'hcr', 'scr', 'gm'];

const checkMeasure = (r) => {
  let err = [];
  let warn = [];

  if (r.year !== 2020) {
    err.push('Invalid Year: ' + r.year);
  }
  if (!types.includes(r.measureTypeOrig)) {
    err.push('Invalid MeasureType: ' + r.measureTypeOrig);
  }
  if (typeof r.measureType != 'number' || !(r.measureType >= 1 && r.measureType <= 7)) {
    err.push('Unexpected MeasureType: ' + r.measureType);
  }
  if (!r.code) {
    err.push('Invalid Code: ' + r.code);
  }
  if (!r.measurePdfUrl) {
    err.push('No MeasurePdfUrl');
  }
  if (!r.measureArchiveUrl) {
    err.push('No MeasureArchiveUrl');
  }
  if (!r.reportTitle) {
    warn.push('No ReportTitle');
  }
  if (r.bitAppropriation !== 0 && r.bitAppropriation !== 1) {
    err.push('Invalid BitAppropriation: ' + r.bitAppropriation);
  }
  if (!r.measureTitle) {
    err.push('No MeasureTitle');
  }
  if (!r.description) {
    err.push('No Description');
  }
  if (!r.currentReferral) {
    warn.push('No CurrentReferral');
  }
  if (r.companion && !r.companionUrl) {
    err.push('No CompanionUrl: ' + r.companionUrl);
  }
  if (err.length > 0) {
    console.log(r);
    console.log(err);
    return false;
  } 
  if (warn.length > 0) {
    let msg = 'MEASURE TYPE: ' + r.measureTypeOrig.toUpperCase();
    msg += ', NUMBER ' + r.measureNumber + ', CODE ' + r.code + ' => ';
    msg += warn.join('; ');
    //console.log(msg);
  } 
  return true;
};

describe('parseBills', () => {
  it('extracts contents', () => {
    for(let type of types) {
      const testfile = './test/data/2020-' + type + '.html';
      const bills = parseBills(fs.readFileSync(testfile, 'utf8'));
      for (let r of bills) {
        expect(checkMeasure(r)).to.be.true;
      };
    }
  }).timeout(10000);
});

describe('parseSpBill', () => {
  it('extracts contents', () => {
    const r = parseBill($(TR));
    expect(r).to.eql({
      year: 2020,
      measureNumber: 35,
      measureTypeOrig: 'hb',
      measureType: 1,
      code: 'HB35 HD1',
      measurePdfUrl:
       'https://www.capitol.hawaii.gov/session2020/bills/HB35_HD1_.pdf',
      measureArchiveUrl:
       'https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=HB&billnumber=35&year=2020',
      reportTitle: 'REPORT TITLE',
      measureTitle: 'MEASURE TITLE',
      description: 'MEASURE TITLE',
      bitAppropriation: 1,
      status: '( S ) 3/13/2020 - STATUS.',
      introducer: 'INTRODUCERS',
      currentReferral: 'CURRENT REFERRAL',
      companion: 'COMPANION',
      companionUrl:
       'http://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=SB&billnumber=965&year=2020'
    });
  });
});
