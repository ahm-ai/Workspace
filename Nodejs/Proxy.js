process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const http = require("http");
const https = require("https");
const port = 3000;

const BASE_URL=""


async function proxyRoute(req, res) {

  const response = await fetch(`${BASE_URL}/${req.url}`);
  const jsonRes = await response.json();
  console.log(jsonRes);
  
  // Set CORS headers
  setCorsHeaders(res);
  
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(jsonRes));
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function handleCorsPreflightRequest(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  // Handle CORS.
  if (handleCorsPreflightRequest(req, res)) {
    return;
  }

  switch (req.url) {
    case "/n/a":
      break;
    default:
      proxyRoute(req, res);
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});