
/**
 *
 * Scrape and store measure data for special session:
 *
 * USAGE: NODE_ENV=<ENV> node dist/scrape-sp-measures.js [SESSION] [YEAR]
 *
 *   ENV:     {production|development|test}
 *   SESSION: {a|b} a) First, b) Second; default a
 *   YEAR:    default current year
 *
 */

const SUPPORTED_ENV = ['production', 'development', 'test'];

const usage = () => {
  console.log();
  console.log('USAGE: NODE_ENV=<ENV> node dist/scrape-sp-measures.js [SESSION] [YEAR]');
  console.log();
  console.log('  ENV:     {production|development|test}');
  console.log('  SESSION: {a|b} a) First, b) Second; default a');
  console.log('  YEAR:    default current year');
  console.log();
}

if (!process.env.NODE_ENV) {
  console.log('NODE_ENV must be specified');
  usage();
  process.exit();
}
if (!SUPPORTED_ENV.includes(process.env.NODE_ENV)) {
  console.log('NODE_ENV must be {production|development|test} but ' + process.env.NODE_ENV);
  usage();
  process.exit();
}

const args = process.argv.slice(2);

if (args.length > 2) {
  usage();
  process.exit();
}
if (args.length > 0) {
  if (args[0] !== 'a' && args[0] !== 'b') {
    console.log('SESSION must be {a|b} but ' + args[0])
    usage();
    process.exit();
  }
}
if (args.length > 1) {
  if (!args[1].match(/^\d+$/)) {
    console.log('YEAR msut be number but ' + args[1]);
    usage();
    process.exit();
  }
}

const session = args[0] || 'a';
const year = parseInt(args[1]) || (new Date).getFullYear();

console.log('ENV: ' + process.env.NODE_ENV + ', SESSION: ' + session + ', YEAR: ' + year);

import SpMeasureScraper from './sp-measure-scraper.js';

SpMeasureScraper.run(year, session);

