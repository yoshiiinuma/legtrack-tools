
CREATE TABLE IF NOT EXISTS scrapeJobs
(
  id integer PRIMARY KEY AUTOINCREMENT,
  dataType tinyint NOT NULL,
  status tinyint NOT NULL,
  startedAt int NOT NULL,
  completedAt int,
  totalNumber smallint unsigned DEFAULT 0 NOT NULL,
  updatedNumber smallint unsigned DEFAULT 0 NOT NULL,
  updateNeeded tinyint(1) DEFAULT 0 NOT NULL
);

CREATE INDEX scrapeJobsIdx ON scrapeJobs(dataType, status, startedAt);

CREATE TABLE IF NOT EXISTS scrapeDetails
(
  scrapeJobId int unsigned,
  measureType tinyint NOT NULL,
  status tinyint NOT NULL,
  startedAt int NOT NULL,
  completedAt int,
  totalNumber smallint unsigned DEFAULT 0 NOT NULL,
  updatedNumber smallint unsigned DEFAULT 0 NOT NULL
);

CREATE INDEX scrapeDetailsIdx ON scrapeDetails(scrapeJobId, measureType, startedAt);

