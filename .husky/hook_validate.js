const fs = require('fs');

const COVERAGE_SUMMARY_FILE = './coverage/coverage-summary.json';
const MINIMUM_COVERAGE_PERCENTAGE = 80;

const coverageSummary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8'));
console.log(coverageSummary);

if (coverageSummary.total.lines.pct === 'Unknown') {
//   console.log('Coverage percentage is unknown');
console.log('\u001b[32m \n ✨ Continue \n \u001b[0m');
  process.exit(0);
}

const overallCoveragePercentage = Object.keys(coverageSummary).filter((key)=>{
    if(key !== 'total'){
        if( coverageSummary[key].lines.pct > MINIMUM_COVERAGE_PERCENTAGE) return false;
        return true;
    }
    return false;
})


console.log(overallCoveragePercentage);

if (!overallCoveragePercentage.length) {
  console.log('\u001b[32m ✨ Great test coverage \u001b[0m');
  process.exit(0);
} else {
  console.error('\u001b[31m Coverage is insufficient  \u001b[0m');
  process.exit(1);
}
