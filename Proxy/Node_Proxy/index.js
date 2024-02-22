import http from "http";
import httpProxy from "http-proxy";

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({});

// Specify the target server you want to proxy to
const target = "http://example.com";

// Create an HTTP server that listens on port 8000
http
  .createServer((req, res) => {
    proxy.web(req, res, { target });
  })
  .listen(8000, () =>
    console.log(
      "\u001b[32m%s\u001b[0m",
      "Proxy server is running on http://localhost:8000"
    )
  );
