#!/bin/bash

echo "Running tests..."
for file in *.js
do
  if [ -e "${file%.*}.spec.js" ]
  then
    coverage=$(jest --coverage "${file%.*}.spec.js" | grep "Statements" | awk '{print $4}' | tr -d '%')
    if [ $coverage -lt 80 ]
    then
      echo "Tests must have at least 80% coverage." >&2
      exit 1
    fi
  fi
done
