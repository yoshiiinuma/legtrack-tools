# LegTrack Tools

## Installation and Setup

```bash
$ git clone https://github.com/yoshiiinuma/legtrack-tools.git
$ cd legtrack-tools
$ cp config/sample.json config/test.json
$ cp config/sample.json config/development.json
$ npm install
```

## SQL Server Docker Install

```bash
$ docker pull mcr.microsoft.com/mssql/server:2019-latest
```

## Configuration

```json
{
  "server":    "SQL-SERVER-HOST",
  "database":  "SQL-SERVER-DATABASE-NAME",
  "user":      "SQL-SERVER-USER",
  "password":  "SQL-SERVER-PASSWORD",
  "resultDir": "./PATH/TO/RESULT-DIR",
  "localDB":   "SQLITE-DATABASE-FILENAME",
  "logFile":   "./PATH/TO/LOGFILE",
  "logLevel":  "{error|warn|info|debug}"
}
```

## Test Database Configuration

Configure ./config/test.js and change the scripts according to your envinronment.

```json
{
  "server":    "localhost",
  "database":  "TestLegTrack",
  "user":      "sa",
  "password":  "Pass123!",
  "resultDir": "./results",
  "localDB":   "test.db",
  "logFile":   "./logs/test.log",
  "logLevel":  "debug"
}
```

## Test Database Setup

- By Scripts

```bash
# SQL Server

$ bin/start-docker-sqlsrv
$ bin/create-test-database
$ bin/sqlsrv/setup

# SQLite3

$ bin/sqlsrv/setup
```

- By Commands

```bash
# SQL Server

$ docker run -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=<your_password>' -p 1433:1433 -d mcr.microsoft.com/mssql/server:2019-latest
$ docker exec -it <container_id|container_name> /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P <your_password>

> CREATE DATABASE <your_database_name>;
> GO
> exit
```

## Run Tests

```bash
# Set up Database
$ ./bin/start-docker-sqlsrv
$ ./bin/start-sqlcmd
> CREATE DATABASE TestLegTrack;
> GO
> EXIT
$ ./bin/sqlsrv/setup
$ ./bin/sqlite3/setup

# Run Test
$ npm run test
```

## Usage

