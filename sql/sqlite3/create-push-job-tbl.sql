
CREATE TABLE IF NOT EXISTS pushJobs
(
  id integer PRIMARY KEY,
  dataType tinyint NOT NULL,
  scrapeJobId int unsigned NOT NULL,
  status tinyint NOT NULL,
  startedAt int NOT NULL,
  completedAt int,
  totalNumber smallint unsigned DEFAULT 0 NOT NULL,
  updatedNumber smallint unsigned DEFAULT 0 NOT NULL
);

CREATE INDEX pushJobsIdx ON pushJobs(dataType, status, startedAt);
