#!/bin/bash

# Determine the base branch (e.g., main or master)
BASE_BRANCH="main"  # or "master", depending on your repository

# Get the list of changed files
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMRT $BASE_BRANCH...HEAD | tr '\n' ',')

# Run sonar-scanner with additional parameters
sonar-scanner -X \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=$SONAR_PASS \
  -Dsonar.projectKey=project \
  -Dsonar.projectName=project \
  -Dsonar.sources=. \
  -Dsonar.inclusions=$CHANGED_FILES \
  -Dsonar.scm.disabled=false \
  -Dsonar.scm.provider=git