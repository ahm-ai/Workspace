const fs = require('fs');

const COVERAGE_SUMMARY_FILE = 'coverage/coverage-summary.json';
const MINIMUM_COVERAGE_PERCENTAGE = 80;

const coverageSummary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8'));
console.log(coverageSummary);


const overallCoveragePercentage = Object.keys(coverageSummary).filter((key)=>{
    if(key !== 'total'){
        if( coverageSummary[key].lines.pct > 80) return false;
        return true;
    }
    return false;
})

// if (overallCoveragePercentage === 'Unknown') {
//   console.log('Coverage percentage is unknown');
//   process.exit(0);
// }
console.log(overallCoveragePercentage);

if (!overallCoveragePercentage.length) {
  console.log('Coverage is sufficient');
  process.exit(0);
} else {
  console.error('Coverage is insufficient');
  process.exit(1);
}
