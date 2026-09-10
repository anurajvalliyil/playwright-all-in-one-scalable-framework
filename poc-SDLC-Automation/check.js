const fs = require('fs');
const report = JSON.parse(fs.readFileSync('./reports/report.json', 'utf8'));
console.log(Object.keys(report));
console.log(report.results ? Object.keys(report.results) : 'No results key');
