docker build -t fitrx-ui .

docker run -p 5178:5173 -v "$(pwd)":/app fitrx-ui





docker run -p 3200:3000 -v "$(pwd)":/app fitrx-ui
