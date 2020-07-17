
import { expect } from 'chai';
import fs from 'fs';
import $ from 'cheerio';

import HearingParser from '../src/hearing-parser.js';

const testFile = './test/data/2020-hearings.html';
const HTML = fs.readFileSync(testFile, "utf8");
const testFile2 = './test/data/no-hearings.html';
const HTML2 = fs.readFileSync(testFile2, "utf8");

const TR = `<tr>
  <td align="center">
      <font color="#124D79" size="1">
          <span id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_Label17"><b>
                  <font size="2">EEP</font>
              </b></span>
      </font>
  </td>
  <td>
      <font color="#124D79" size="1">
          <a id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_HyperLink" class="visited" href="https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=SB&amp;billnumber=2629"><b>
                  <font size="2">SB2629 SD2</font>
              </b></a>
          -
          <span id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_Label17">
              <font size="1">RELATING TO THE ENVIRONMENT.</font>
          </span>
      </font>
  </td>
  <td align="left" width="125">
      <font color="#124D79" size="2">
          <span id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_Label27">6/22/2020 9:30 AM</span>
      </font>
  </td>
  <td align="center">
      <font color="#124D79" size="2">
          <span id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_Label27">325</span>
      </font>
  </td>
  <td align="left" width="175">
      <font color="#124D79" size="3">
          <a id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_HyperLink2" class="visited" href="https://www.capitol.hawaii.gov/session2020/hearingnotices/HEARING_EEP_06-22-20_.HTM" target="_blank">HEARING_EEP_06-22-20</a>
          <a id="ctl00_ContentPlaceHolderCol1_GridView1_ctl02_HyperLink3" href="https://www.capitol.hawaii.gov/session2020/hearingnotices/HEARING_EEP_06-22-20_.pdf" target="_blank"><img src="Images/pdf_icon_small.gif" alt border="0"></a>
      </font>
  </td>
</tr>`;

const trWithNoHearings = `<tr>
    <td colspan="5"><font color="#124D79" size="1">No Hearings </font></td>
  </tr>`;

const types = ['hb', 'sb', 'hr', 'sr', 'hcr', 'scr', 'gm'];
const typesUp = ['HB', 'SB', 'HR', 'SR', 'HCR', 'SCR', 'GM'];

const checkHearing = (r) => {
  let err = [];
  let warn = [];

  if (r.year !== 2020) {
    err.push('Invalid Year: ' + r.year);
  }
  if (!typesUp.includes(r.measureTypeOrig)) {
    err.push('Invalid MeasureType: ' + r.measureTypeOrig);
  }
  if (!types.includes(r.measureType)) {
    err.push('Invalid MeasureType: ' + r.measureType);
  }
  if (!r.measureRelativeUrl) {
    err.push('No MeasureRelativeUrl');
  }
  if (!r.code) {
    err.push('No Code: ' + r.code);
  }
  if (!r.committee) {
    err.push('No Committee: ' + r.committee);
  }
  if (!r.datetime) {
    err.push('No DateTime: ' + r.datetime);
  }
  if (!r.description) {
    err.push('No Description');
  }
  if (!r.room) {
    err.push('No Room');
  }
  if (!r.notice) {
    warn.push('No Notice');
  }
  if (!r.noticePdfUrl) {
    err.push('No MeasurePdfUrl');
  }
  if (!r.noticeUrl) {
    err.push('No MeasureUrl');
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
    console.log(msg);
  }
  return true;
};

describe('HearingParser#parseAll', () => {
  context('with hearing data', () => {
    it('extracts contents', () => {
      const r = HearingParser.parseAll(HTML);
      for (let e of r) {
        expect(checkHearing(e)).to.be.true;
      };
    }).timeout(5000);
  });

  context('with no hearing data', () => {
    it('returns empty array', () => {
      const r = HearingParser.parseAll(HTML2);
      expect(r).to.eql([]);
    })
  });
});

describe('HearingParser#parse', () => {
  context('with hearing data', () => {
    it('extracts contents', () => {
      const ts = new Date('6/22/2020 9:30 AM').getTime();
      const r = HearingParser.parse($(TR));

      expect(r).to.eql({
        year: 2020,
        measureNumber: 2629,
        measureTypeOrig: 'SB',
        measureType: 'sb',
        measureRelativeUrl: 'https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=SB&billnumber=2629',
        committee: 'EEP',
        description: 'RELATING TO THE ENVIRONMENT.',
        datetime: '6/22/2020 9:30 AM',
        timestamp: ts,
        code: 'SB2629 SD2',
        room: '325',
        notice: 'HEARING_EEP_06-22-20',
        noticeUrl: 'https://www.capitol.hawaii.gov/session2020/hearingnotices/HEARING_EEP_06-22-20_.HTM',
        noticePdfUrl: 'https://www.capitol.hawaii.gov/session2020/hearingnotices/HEARING_EEP_06-22-20_.pdf',
      });
    });
  });

  context('with no hearing data', () => {
    const tr = $(trWithNoHearings);

    it('returns null', () => {
      const r = HearingParser.parse(tr);
      expect(r).to.be.null;
    });
  });
});

