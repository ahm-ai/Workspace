#!/bin/bash

COVERAGE_SUMMARY_FILE="coverage/coverage-summary.json"

MINIMUM_COVERAGE_PERCENTAGE=80

# Read the overall coverage percentage from the coverage summary file
OVERALL_COVERAGE_PERCENTAGE=$(cat $COVERAGE_SUMMARY_FILE | jq '.total.lines.pct')

# Check if the overall coverage percentage is at least the minimum required
if (( $(echo "$OVERALL_COVERAGE_PERCENTAGE >= $MINIMUM_COVERAGE_PERCENTAGE" | bc -l) )); then
    echo "Coverage is sufficient"
else
    echo "Coverage is insufficient"
    exit 1
fi
