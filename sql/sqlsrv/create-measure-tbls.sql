
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='measures' AND xtype='U')
BEGIN
  CREATE TABLE measures
  (
    id int identity(1,1),
    year smallint NOT NULL,
    measureType nchar(3) NOT NULL,
    measureNumber smallint NOT NULL,
    lastUpdated int,
    code nvarchar(64),
    measurePdfUrl nvarchar(512),
    measureArchiveUrl nvarchar(512),
    measureTitle nvarchar(512),
    reportTitle nvarchar(512),
    bitAppropriation tinyint,
    description nvarchar(1024),
    status nvarchar(512),
    introducer nvarchar(512),
    currentReferral nvarchar(256),
    trackingDepts nvarchar(256),
    companion nvarchar(256),
    CONSTRAINT PK_measures PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_measures UNIQUE (year, measureType, measureNumber)
  )
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='measures_lastupdated_idx')
BEGIN
  CREATE INDEX measures_lastupdated_idx ON measures(lastUpdated);
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='trackedMeasures' AND xtype='U')
BEGIN
  CREATE TABLE trackedMeasures
  (
    id int identity(1,1) NOT NULL UNIQUE,
    year smallint NOT NULL,
    deptId smallint NOT NULL FOREIGN KEY REFERENCES depts(id),
    measureId int NOT NULL FOREIGN KEY REFERENCES measures(id),
    tracked bit DEFAULT 1,
    billProgress nvarchar(18),
    scrNo nvarchar(18),
    adminBill bit DEFAULT 0,
    dead bit DEFAULT 0,
    confirmed bit DEFAULT 0,
    passed bit DEFAULT 0,
    ccr bit DEFAULT 0,
    appropriation bit DEFAULT 0,
    appropriationAmount nvarchar(256),
    report bit DEFAULT 0,
    directorAttention bit DEFAULT 0,
    govMsgNo nvarchar(12),
    dateToGov date,
    actNo nvarchar(12),
    actDate date,
    reportingRequirement nvarchar(256),
    reportDueDate nvarchar(12),
    sectionsAffected nvarchar(128),
    effectiveDate date,
    veto bit DEFAULT 0,
    vetoDate date,
    vetoOverride bit DEFAULT 0,
    vetoOverrideDate date,
    finalBill nvarchar(128),
    version nvarchar(48),
    createdBy int,
    createdAt datetime,
    modifiedBy int,
    modifiedAt datetime,
    CONSTRAINT PK_trackedmeasures PRIMARY KEY CLUSTERED (year, deptId, measureId),
    INDEX IX_trackedmeasures NONCLUSTERED (id)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='positions' AND xtype='U')
BEGIN
  CREATE TABLE positions
  (
    id int identity(1,1) NOT NULL UNIQUE,
    year smallint NOT NULL,
    deptId smallint NOT NULL FOREIGN KEY REFERENCES depts(id),
    measureId int NOT NULL FOREIGN KEY REFERENCES measures(id),
    groupId int NOT NULL FOREIGN KEY REFERENCES groups(id),
    role nvarchar(12),
    category nvarchar(12),
    position nvarchar(12),
    approvalStatus nvarchar(12),
    status nvarchar(12),
    assignedTo int,
    version nvarchar(48),
    createdBy int,
    createdAt datetime,
    modifiedBy int,
    modifiedAt datetime,
    CONSTRAINT PK_positions PRIMARY KEY CLUSTERED (year, deptId, measureId, groupId),
    INDEX IX_positions NONCLUSTERED (id),
    INDEX IX_positions_by_group NONCLUSTERED (groupId, year, deptId, measureId)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='comments' AND xtype='U')
BEGIN
  CREATE TABLE comments
  (
    year smallint NOT NULL,
    positionId int NOT NULL FOREIGN KEY REFERENCES positions(id),
    createtBy int NOT NULL FOREIGN KEY REFERENCES users(id),
    createdAt datetime,
    comment ntext,
    CONSTRAINT PK_comments PRIMARY KEY CLUSTERED (year, positionId, createdAt)
  )
END

