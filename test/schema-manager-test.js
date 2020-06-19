
import { expect } from 'chai';

import createSchemaManager from '../src/schema-manager.js'

/*
 *
 * Check if User Defined Table is created
 SELECT * FROM sys.table_types WHERE is_user_defined = 1;
 GO
 * Check if Stored Proc is created
 SELECT name,type,xtype FROM sysobjects WHERE name like 'spMeasure%';
 GO
 *
 */
//describe('SchemaManager create/drop SpMeasure Table', () => {
//  const schema = createSchemaManager('test');
//  let r;
//
//  it('creates spMeasureTable', async () => {
//    r = await schema.dropSpMeasureTbl(); 
//    console.log('--------------------------');
//    console.log(r);
//    r = await schema.createSpMeasureTbl(); 
//    console.log('--------------------------');
//    console.log(r);
//    expect(false).to.be.true;
//  });
//});

//describe('SchemaManager create/drop SpMeasure Upsert Proc', () => {
//  const schema = createSchemaManager('test');
//  let r;
//
//  it('creates spMeasureTable', async () => {
//    r = await schema.dropSpMeasureUpsertProc(); 
//    console.log('--------------------------');
//    console.log(r);
//    r = await schema.dropSpMeasureTblType(); 
//    console.log('--------------------------');
//    console.log(r);
//    r = await schema.createSpMeasureTblType(); 
//    console.log('--------------------------');
//    console.log(r);
//    r = await schema.createSpMeasureUpsertProc(); 
//    console.log('--------------------------');
//    console.log(r);
//    expect(false).to.be.true;
//  });
//});
