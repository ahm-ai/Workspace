
# Vault Login
# To login using LDAP method:
vault login -method=ldap username=<USERNAME> password=<PASSWORD>

# Add Secrets
# To add secrets from a JSON file:
vault kv put -ns=<NAMESPACE> <PATH> @<FILE>.json

# Get Secrets
# To get secrets:
vault kv get -ns=<NAMESPACE> <PATH>

