
const DataType = {
  MEASURE: 1,
  HEARING: 2,
  SPECIAL_SESSION: 3
};

const MeasureType = {
  hb: 1,
  sb: 2,
  hr: 3,
  sr: 4,
  hcr: 5,
  scr: 6,
  gm: 7,
  jc: 8,
  spa: 9,
  spb: 10,
  unknown: 99,
};

const JobStatus = {
  started: 1,
  skipped: 2,
  failed: 3,
  completed: 4,
};

export default {
  DataType,
  MeasureType,
  JobStatus,
}; 
