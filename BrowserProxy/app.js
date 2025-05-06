import express from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import http from 'http'; // Required for the CONNECT method handling
import net from 'net';   // Required for the CONNECT method handling
import url from 'url';   // Required for the CONNECT method handling

// --- Configuration ---
const PORT = process.env.PORT || 8080; // Port for the proxy server to listen on
const HOST = '127.0.0.1';             // Host for the proxy server (e.g., '127.0.0.1' for localhost)

const app = express();

// --- Body Parsing Middleware ---
// Important: These should come *before* the proxy middleware if you need to proxy requests
// with bodies (e.g., POST, PUT with JSON or form data) and use fixRequestBody.
// For CONNECT requests, these are not strictly necessary as CONNECT doesn't have a body.
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads

// --- VERY EARLY Global Request Logger ---
app.use((req, res, next) => {
    console.log(`[GLOBAL LOGGER] Timestamp: ${new Date().toISOString()}`);
    console.log(`[GLOBAL LOGGER] Incoming Request: ${req.method} ${req.originalUrl}`); // Use originalUrl for full path
    console.log(`[GLOBAL LOGGER] Headers: ${JSON.stringify(req.headers, null, 2)}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[GLOBAL LOGGER] Body: ${JSON.stringify(req.body, null, 2)}`);
    }
    next();
});

// --- Proxy Middleware Configuration ---
const proxyOptions = {
    /**
     * Determines the target for the proxy.
     * For HTTP/HTTPS requests, it returns the full URL.
     * For CONNECT requests (HTTPS tunneling), it should return an object with host and port.
     * However, http-proxy-middleware's standard router doesn't directly support returning
     * host/port for CONNECT in a way that bypasses its internal URL parsing for the target.
     * The 'target' property is more suitable for a fixed target.
     * For dynamic CONNECT, we will handle it outside the main proxy middleware.
     */
    router: (req) => {
        // This router will primarily handle non-CONNECT requests.
        // CONNECT requests will be intercepted and handled separately before this proxy middleware.
        if (req.method === 'CONNECT') {
            // This should ideally not be hit if CONNECT is handled separately.
            // If it is, it means our separate CONNECT handler didn't intercept it.
            console.warn(`[PROXY ROUTER] CONNECT request unexpectedly reached router for: ${req.url}`);
            // Returning undefined or null might cause issues.
            // For safety, we can return a dummy https URL to satisfy HPM's expectations,
            // but the actual tunneling is what matters.
            return `https://${req.url.split(':')[0]}`; // e.g. https://www.google.com
        }

        let targetUrl;
        // For direct HTTP requests proxied (browser sends absolute URI)
        if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
            targetUrl = req.url;
        } else {
            // This case is less common for a forward proxy where browsers send absolute URIs.
            // If it's a relative path, it implies the proxy itself is the origin.
            const protocol = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const hostHeader = req.headers.host; // This would be the proxy's host if path is relative
            targetUrl = `${protocol}://${hostHeader}${req.url}`;
            console.warn(`[PROXY ROUTER] Warning: Relative path received: ${req.url}. Constructed target: ${targetUrl}`);
        }
        console.log(`[PROXY ${req.method} ROUTER] Routing to: ${targetUrl}`);
        return targetUrl;
    },
    changeOrigin: true,  // Important for correct Host header to target
    secure: false,       // Do not validate SSL certs of the target (if proxy makes HTTPS req to another server)
    ws: true,            // Enable WebSocket proxying
    logLevel: 'debug',   // For detailed http-proxy-middleware logs
    onProxyReq: (proxyReq, req, res) => {
        // This event fires for requests that http-proxy-middleware handles.
        // It will NOT fire for the initial CONNECT request if handled separately,
        // nor for the data flowing through the established tunnel.
        console.log(`[HPM onProxyReq] Sending ${req.method} request to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-forwarded-host');
        proxyReq.removeHeader('x-forwarded-proto');

        // fixRequestBody is needed if you're proxying POST/PUT etc. with JSON/form bodies
        // Ensure req.body is parsed (e.g., using express.json()) before this middleware.
        if (req.body && Object.keys(req.body).length > 0 && req.method !== 'CONNECT') {
            fixRequestBody(proxyReq, req);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[HPM onProxyRes] Received ${proxyRes.statusCode} from target for: ${req.method} ${req.url}`);
    },
    onError: (err, req, res, target) => {
        console.error('[HPM onError] Error:', err);
        let targetInfo = 'N/A';
        if (target) {
            if (typeof target === 'string') {
                targetInfo = target;
            } else if (typeof target === 'object' && target.href) {
                targetInfo = target.href;
            } else if (typeof target === 'object' && target.host && target.port) {
                targetInfo = `${target.protocol || 'http:'}//${target.host}:${target.port}`;
            } else {
                try {
                    targetInfo = JSON.stringify(target);
                } catch (e) { /* ignore */ }
            }
        }
        console.error(`[HPM onError] Target: ${targetInfo}`);
        console.error(`[HPM onError] Request URL: ${req.originalUrl}`); // Use originalUrl
        console.error(`[HPM onError] Request Method: ${req.method}`);

        // Check if headers have already been sent.
        // For HPM errors, res is often an instance of http.ServerResponse.
        // If target is not available or connection fails, HPM might try to write a response.
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
        }
        if (res && typeof res.end === 'function' && !res.writableEnded) {
            res.end(`Proxy Error: ${err.message}`);
        } else if (res && res.socket && !res.writableEnded) {
            // If res.end is not available or stream is ended but socket is not, destroy socket.
            console.error('[HPM onError] Destroying socket due to error and inability to send response.');
            res.socket.destroy(err);
        }
    },
};

// Create the proxy middleware instance
const proxy = createProxyMiddleware(proxyOptions);

// --- HTTP Server and CONNECT Method Handling ---
const server = http.createServer(app); // Use http.createServer to get access to 'connect' event

server.on('connect', (req, clientSocket, head) => {
    // This event is triggered when the client sends an HTTP CONNECT request.
    // req: http.IncomingMessage - The request object for the CONNECT request.
    // clientSocket: net.Socket - The TCP socket between the client and the proxy.
    // head: Buffer - The first packet of the TSL/SSL handshake (if any was already sent by client).

    const { port, hostname } = url.parse(`http://${req.url}`); // req.url is 'hostname:port'

    if (!hostname || !port) {
        console.error(`[CONNECT HANDLER] Invalid CONNECT request URL: ${req.url}`);
        clientSocket.write(`HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n`);
        clientSocket.end();
        return;
    }

    console.log(`[CONNECT HANDLER] Attempting to tunnel to ${hostname}:${port}`);

    // Establish a TCP connection to the target server
    const serverSocket = net.connect(port, hostname, () => {
        console.log(`[CONNECT HANDLER] Tunnel established to ${hostname}:${port}`);

        // Tell the client that the connection is established
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                           'Proxy-agent: Node.js-Proxy\r\n' +
                           '\r\n');

        // If there was a 'head' packet, forward it to the server.
        // This is part of the TLS handshake that the client might have sent preemptively.
        if (head && head.length) {
            serverSocket.write(head);
        }

        // Pipe data between client and server sockets
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
    });

    // --- Error Handling for Sockets ---
    clientSocket.on('error', (err) => {
        console.error(`[CONNECT HANDLER] Client socket error: ${err.message}`);
        if (serverSocket && !serverSocket.destroyed) {
            serverSocket.destroy();
        }
    });
    clientSocket.on('close', (hadError) => {
        // console.log(`[CONNECT HANDLER] Client socket closed. Had error: ${hadError}`);
        if (serverSocket && !serverSocket.destroyed) {
            serverSocket.destroy();
        }
    });

    serverSocket.on('error', (err) => {
        console.error(`[CONNECT HANDLER] Target server socket error for ${hostname}:${port} - ${err.message}`);
        // If the connection to the target server fails, inform the client.
        if (!clientSocket.destroyed) {
            // Try to send a 502 Bad Gateway if the client socket is still writable
            // and the HTTP handshake (200 OK) hasn't been completed.
            // However, at this stage, the client expects a raw TCP stream after 200 OK.
            // So, abruptly closing might be the only option if 200 OK was already sent.
            if (clientSocket.writable && !clientSocket.errored) {
                 // Check if 200 OK was already sent. If so, we can't send another HTTP status.
                 // This check is a bit tricky here. If we are in 'error' before 'connect' on serverSocket,
                 // we haven't sent 200 OK yet.
                clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n`);
            }
            clientSocket.end(); // Ensure client socket is closed.
        }
    });
    serverSocket.on('close', (hadError) => {
        // console.log(`[CONNECT HANDLER] Target server socket closed for ${hostname}:${port}. Had error: ${hadError}`);
        if (clientSocket && !clientSocket.destroyed) {
            clientSocket.destroy();
        }
    });
});


// Apply the http-proxy-middleware for all other requests (GET, POST, etc.)
// This needs to be after the server.on('connect') setup, as 'connect' is handled by the http.Server directly.
// All non-CONNECT requests will be passed to the Express app, and then to this middleware.
app.use('/', proxy);


// --- Start Server ---
server.listen(PORT, HOST, () => {
    console.log(`--------------------------------------------------------------------`);
    console.log(`  Express HTTP/HTTPS Proxy Server (ESM) with Custom CONNECT`);
    console.log(`  Listening on: http://${HOST}:${PORT}`);
    console.log(`  Proxying non-CONNECT traffic with http-proxy-middleware.`);
    console.log(`  Handling CONNECT requests for HTTPS tunneling directly.`);
    console.log(`--------------------------------------------------------------------`);
    console.log(`\nDebug logs will appear below:\n`);
});

// --- Process-wide Error Handlers ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('[PROCESS ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
    console.error('[PROCESS ERROR] Uncaught Exception:', error);
    // Application specific logging, throwing an error, or other logic here
    // It's often recommended to gracefully shut down the server on uncaught exceptions.
    process.exit(1); // Exiting after an uncaught exception is a common practice
});
