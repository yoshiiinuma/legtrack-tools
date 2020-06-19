IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='spMeasures' AND xtype='U')
BEGIN
  CREATE TABLE spMeasures
  (
    id INT IDENTITY(1,1),
    year SMALLINT NOT NULL,
    spSessionId CHAR(1) NOT NULL,
    measureType NCHAR(3) NOT NULL,
    measureNumber SMALLINT NOT NULL,
    lastUpdated INT,
    code NVARCHAR(64),
    measurePdfUrl NVARCHAR(512),
    measureArchiveUrl NVARCHAR(512),
    measureTitle NVARCHAR(512),
    reportTitle NVARCHAR(512),
    bitAppropriation TINYINT,
    description NVARCHAR(1024),
    status NVARCHAR(512),
    introducer NVARCHAR(512),
    currentReferral NVARCHAR(256),
    trackingDepts NVARCHAR(256),
    companion NVARCHAR(256),
    CONSTRAINT PK_spMeasures PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_spMeasures UNIQUE (year, spSessionId, measureType, measureNumber)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='spTrackedMeasures' AND xtype='U')
BEGIN
  CREATE TABLE spTrackedMeasures
  (
    id int identity(1,1) NOT NULL UNIQUE,
    year smallint NOT NULL,
    deptId smallint NOT NULL FOREIGN KEY REFERENCES depts(id),
    measureId int NOT NULL FOREIGN KEY REFERENCES spMeasures(id),
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
    CONSTRAINT PK_spTrackedMeasures PRIMARY KEY CLUSTERED (year, deptId, measureId),
    INDEX IX_spTrackedMeasures NONCLUSTERED (id)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='spPositions' AND xtype='U')
BEGIN
  CREATE TABLE spPositions
  (
    id int identity(1,1) NOT NULL UNIQUE,
    year smallint NOT NULL,
    deptId smallint NOT NULL FOREIGN KEY REFERENCES depts(id),
    measureId int NOT NULL FOREIGN KEY REFERENCES spMeasures(id),
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
    CONSTRAINT PK_spPositions PRIMARY KEY CLUSTERED (year, deptId, measureId, groupId),
    INDEX IX_spPositions NONCLUSTERED (id),
    INDEX IX_spPositions_by_group NONCLUSTERED (groupId, year, deptId, measureId)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='spComments' AND xtype='U')
BEGIN
  CREATE TABLE spComments
  (
    year smallint NOT NULL,
    positionId int NOT NULL FOREIGN KEY REFERENCES spPositions(id),
    createtBy int NOT NULL FOREIGN KEY REFERENCES users(id),
    createdAt datetime,
    comment ntext,
    CONSTRAINT PK_spComments PRIMARY KEY CLUSTERED (year, positionId, createdAt)
  )
END
