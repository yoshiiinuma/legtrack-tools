IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='depts' AND xtype='U')
BEGIN
  CREATE TABLE depts
  (
    id smallint,
    deptName nchar(4) NOT NULL,
    CONSTRAINT PK_depts PRIMARY KEY CLUSTERED (id)
  )
  INSERT INTO depts (id, deptName) VALUES (1,'ADM'), (2,'AGR'), (3,'AGS'), (4,'BED'), (5,'BUF'),
     (6,'DEF'), (7,'ETS'), (8,'GOV'), (9,'LBR'), (10,'LNR'), (11,'OIP'), (12,'PSD'), (13,'TRN')
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='roles' AND xtype='U')
BEGIN
  CREATE TABLE roles
  (
    id tinyint,
    title nvarchar(15) NOT NULL,
    permission tinyint NOT NULL,
    CONSTRAINT PK_roles PRIMARY KEY CLUSTERED (id)
  )
  INSERT INTO roles (id, title, permission) VALUES (1,'Admin',8), (2,'Coordinator',4), (3,'Cooperator',2),
    (4,'Approver', 1), (5,'Guest', 0)
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
  CREATE TABLE users
  (
    id int identity(1,1),
    deptId smallint NOT NULL FOREIGN KEY REFERENCES depts(id),
    objectId varchar(128),
    userPrincipalName nvarchar(256) NOT NULL,
    displayName nvarchar(128) NOT NULL,
    department nvarchar(128),
    CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='groups' AND xtype='U')
BEGIN
  CREATE TABLE groups
  (
    id int identity(1,1),
    deptId smallint NOT NULL FOREIGN KEY REFERENCES depts(id),
    groupName nvarchar(64) NOT NULL,
    description nvarchar(512),
    CONSTRAINT PK_groups PRIMARY KEY CLUSTERED (id),
    INDEX IX_groups_dept NONCLUSTERED (deptId, id)
  )
END

IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='groupMembers' AND xtype='U')
BEGIN
  CREATE TABLE groupMembers
  (
    id int identity(1,1) NOT NULL UNIQUE,
    userId int NOT NULL FOREIGN KEY REFERENCES users(id),
    groupId int NOT NULL FOREIGN KEY REFERENCES groups(id),
    roleId tinyint NOT NULL FOREIGN KEY REFERENCES roles(id),
    permission tinyint NOT NULL
    CONSTRAINT PK_groupmembers PRIMARY KEY CLUSTERED (userId, groupId, roleId, permission),
    INDEX IX_groupmembers_by_group NONCLUSTERED (groupId, userId),
    INDEX IX_groupmembers_id NONCLUSTERED (id)
  )
END

