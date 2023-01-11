
value1="/Users/home/Downloads/2023-01-10_21-15"

curl -X POST http://localhost:8080/watch \
-H "Content-Type: application/json" -d "{\"folderName\":\"$value1\"}"
