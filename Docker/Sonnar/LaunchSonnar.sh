
# Install SonarQube.
docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:latest

# Install Sonar Scanner CLI.
brew install sonar-scanner

# Run it in a project directory.
sonar-scanner -X \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=<PASSWORD> \
  -Dsonar.projectKey=project \
  -Dsonar.projectName=project \
  -Dsonar.sources=.