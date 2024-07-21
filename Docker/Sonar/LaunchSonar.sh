
# Install SonarQube.
docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:latest

# Install Sonar Scanner CLI.
brew install sonar-scanner

brew install reviewdog/tap/reviewdog

# Run it in a project directory.
sonar-scanner -X \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=$SONAR_PASS \
  -Dsonar.projectKey=project \
  -Dsonar.projectName=project \
  -Dsonar.sources=.


curl -u admin:$SONAR_PASS "http://localhost:9000/api/issues/search?componentKeys=project" | \
jq -r '.issues[] | "\(.component):\(.line):\(.message) [\(.severity)]"' | \
reviewdog -f=checkstyle -reporter=github-pr-review