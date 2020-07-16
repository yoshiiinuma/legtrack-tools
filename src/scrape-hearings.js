/**
 *
 * Scrape and store hearings data
 *
 * USAGE: NODE_ENV=<ENV> node dist/scrape-hearings.js [YEAR]
 *
 *   ENV:     {production|development|test}
 *   YEAR:    default current year
 *
 */

const SUPPORTED_ENV = ['production', 'development', 'test'];

const usage = () => {
  console.log();
  console.log('USAGE: NODE_ENV=<ENV> node dist/scrape-hearings.js [YEAR]');
  console.log();
  console.log('  ENV:  {production|development|test}');
  console.log('  YEAR: default current year');
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

if (args.length > 1) {
  usage();
  process.exit();
}
if (args.length > 0) {
  if (!args[0].match(/^\d+$/)) {
    console.log('YEAR msut be number but ' + args[0]);
    usage();
    process.exit();
  }
}

const year = args[0] || (new Date).getFullYear();

console.log('ENV: ' + process.env.NODE_ENV + ', YEAR: ' + year);

import HearingScraper from './hearing-scraper.js';

HearingScraper.run(year);

