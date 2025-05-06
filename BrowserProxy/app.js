import express from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import http from 'http'; // Required for the CONNECT method handling
import net from 'net';   // Required for the CONNECT method handling
import url from 'url';   // Required for the CONNECT method handling
import zlib from 'zlib'; // For handling compressed responses (gzip, deflate)
import fs from 'fs';     // For reading local files
import path from 'path'; // For constructing file paths
import { fileURLToPath } from 'url'; // To get __dirname in ES modules
import { dirname } from 'path';      // To get __dirname in ES modules

// --- ES Module __dirname Helper ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
const PORT = process.env.PORT || 8080; // Port for the proxy server to listen on
const HOST = '127.0.0.1';             // Host for the proxy server (e.g., '127.0.0.1' for localhost)

const app = express();

// --- Body Parsing Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- VERY EARLY Global Request Logger ---
app.use((req, res, next) => {
    console.log(`[GLOBAL LOGGER] Timestamp: ${new Date().toISOString()}`);
    console.log(`[GLOBAL LOGGER] Incoming Request: ${req.method} ${req.originalUrl}`);
    console.log(`[GLOBAL LOGGER] Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
});

// --- Custom Middleware to Serve Local JSON Based on URL ---
app.use((req, res, next) => {
    // Example: If URL contains '/api/local/mydata', serve 'mydata.json' from a 'local_files' directory
    if (req.originalUrl.includes('/api/local/mydata')) { // <<< YOUR URL CONDITION HERE
        const localFileName = 'mydata.json'; // <<< YOUR LOCAL JSON FILENAME
        const filePath = path.join(__dirname, 'local_files', localFileName); // Assumes a 'local_files' subdirectory

        console.log(`[LOCAL FILE SERVER] Request for ${req.originalUrl} matched. Attempting to serve ${filePath}`);

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.error(`[LOCAL FILE SERVER] File not found: ${filePath}`);
                    res.status(404).json({ error: 'Local data not found', detail: `File ${localFileName} does not exist.` });
                } else {
                    console.error(`[LOCAL FILE SERVER] Error reading file ${filePath}:`, err);
                    res.status(500).json({ error: 'Internal server error while serving local file.' });
                }
                return; // Important: Stop further processing
            }

            try {
                // Validate if it's actual JSON, though fs.readFile gives a string
                JSON.parse(data); 
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(data);
                console.log(`[LOCAL FILE SERVER] Successfully served ${filePath}`);
            } catch (parseError) {
                console.error(`[LOCAL FILE SERVER] File ${filePath} is not valid JSON:`, parseError);
                res.status(500).json({ error: 'Internal server error: Local file is not valid JSON.' });
            }
            // No next() here, as we've handled the response.
        });
    } else {
        // If URL doesn't match, pass to the next middleware (the proxy)
        next();
    }
});


// --- Proxy Middleware Configuration ---
const proxyOptions = {
    router: (req) => {
        if (req.method === 'CONNECT') {
            console.warn(`[PROXY ROUTER] CONNECT request unexpectedly reached router for: ${req.url}`);
            return `https://${req.url.split(':')[0]}`;
        }
        let targetUrl;
        if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
            targetUrl = req.url;
        } else {
            const protocol = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const hostHeader = req.headers.host;
            targetUrl = `${protocol}://${hostHeader}${req.url}`;
            console.warn(`[PROXY ROUTER] Warning: Relative path received: ${req.url}. Constructed target: ${targetUrl}`);
        }
        console.log(`[PROXY ${req.method} ROUTER] Routing to: ${targetUrl}`);
        return targetUrl;
    },
    changeOrigin: true,
    secure: false,
    ws: true,
    logLevel: 'debug',
    selfHandleResponse: true,

    onProxyReq: (proxyReq, req, res) => {
        console.log(`[HPM onProxyReq] Sending ${req.method} request to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
        proxyReq.setHeader('X-My-Proxy', 'Injecting-Header-Example');
        console.log('[HPM onProxyReq] Added custom header X-My-Proxy');
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-forwarded-host');
        proxyReq.removeHeader('x-forwarded-proto');
        if (req.body && Object.keys(req.body).length > 0 && req.method !== 'CONNECT') {
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                try {
                    fixRequestBody(proxyReq, req);
                } catch (error) {
                    console.error('[HPM onProxyReq] Error modifying JSON request body:', error);
                }
            } else {
                 fixRequestBody(proxyReq, req);
            }
        }
    },

    onProxyRes: (proxyRes, req, res) => {
        console.log(`[HPM onProxyRes] Received response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
        // console.log(`[HPM onProxyRes] Original response headers: ${JSON.stringify(proxyRes.headers, null, 2)}`);
        const bodyChunks = [];
        proxyRes.on('data', (chunk) => {
            bodyChunks.push(chunk);
        });
        proxyRes.on('end', () => {
            let responseBody = Buffer.concat(bodyChunks);
            const originalHeaders = { ...proxyRes.headers };
            const contentEncoding = originalHeaders['content-encoding'];
            // let isCompressed = false; // Not strictly needed if not re-compressing

            if (contentEncoding === 'gzip') {
                try {
                    responseBody = zlib.gunzipSync(responseBody);
                    delete originalHeaders['content-encoding'];
                    // isCompressed = true;
                    console.log('[HPM onProxyRes] Decompressed GZIP response body.');
                } catch (err) {
                    console.error('[HPM onProxyRes] GZIP decompression error:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Proxy error: Failed to decompress response.');
                    return;
                }
            } else if (contentEncoding === 'deflate') {
                try {
                    responseBody = zlib.inflateSync(responseBody);
                    delete originalHeaders['content-encoding'];
                    // isCompressed = true;
                    console.log('[HPM onProxyRes] Decompressed DEFLATE response body.');
                } catch (err) {
                    console.error('[HPM onProxyRes] DEFLATE decompression error:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Proxy error: Failed to decompress response.');
                    return;
                }
            }
            
            const contentType = originalHeaders['content-type'];
            let modifiedBody = responseBody;

            if (contentType && contentType.includes('text/html')) {
                try {
                    let htmlContent = responseBody.toString('utf8');
                    const banner = '<div style="background-color: yellow; color: black; padding: 10px; text-align: center; position: fixed; top: 0; width: 100%; z-index: 9999;">Proxied and Modified!</div>';
                    if (htmlContent.includes('</body>')) {
                        htmlContent = htmlContent.replace('</body>', `${banner}</body>`);
                    } else {
                        htmlContent += banner;
                    }
                    modifiedBody = Buffer.from(htmlContent, 'utf8');
                    console.log('[HPM onProxyRes] Modified HTML response body.');
                } catch (error) {
                    console.error('[HPM onProxyRes] Error modifying HTML response body:', error);
                    modifiedBody = responseBody;
                }
            } 
            else if (contentType && contentType.includes('application/json')) {
                try {
                    let jsonContent = JSON.parse(responseBody.toString('utf8'));
                    jsonContent.proxyMessage = "This JSON response was modified by the proxy.";
                    modifiedBody = Buffer.from(JSON.stringify(jsonContent), 'utf8');
                    console.log('[HPM onProxyRes] Modified JSON response body.');
                } catch (error) {
                    console.error('[HPM onProxyRes] Error modifying JSON response body:', error);
                    modifiedBody = responseBody;
                }
            }
            originalHeaders['content-length'] = Buffer.byteLength(modifiedBody);
            originalHeaders['X-Proxy-Modified'] = 'true';
            // console.log(`[HPM onProxyRes] Sending modified response to client. New Content-Length: ${originalHeaders['content-length']}`);
            res.writeHead(proxyRes.statusCode, originalHeaders);
            res.end(modifiedBody);
        });
        proxyRes.on('error', (err) => {
            console.error('[HPM onProxyRes] Error from target server response stream:', err);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
            }
            res.end('Proxy error: Error receiving data from target server.');
        });
    },
    onError: (err, req, res, target) => {
        console.error('[HPM onError] Error:', err);
        let targetInfo = 'N/A';
        if (target) {
            if (typeof target === 'string') targetInfo = target;
            else if (typeof target === 'object' && target.href) targetInfo = target.href;
            else if (typeof target === 'object' && target.host && target.port) targetInfo = `${target.protocol || 'http:'}//${target.host}:${target.port}`;
            else try { targetInfo = JSON.stringify(target); } catch (e) { /* ignore */ }
        }
        console.error(`[HPM onError] Target: ${targetInfo}`);
        console.error(`[HPM onError] Request URL: ${req.originalUrl}`);
        console.error(`[HPM onError] Request Method: ${req.method}`);
        if (res && typeof res.writeHead === 'function' && !res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
        if (res && typeof res.end === 'function' && !res.writableEnded) res.end(`Proxy Error: ${err.message}`);
        else if (res && res.socket && !res.socket.destroyed && !res.writableEnded) {
            console.error('[HPM onError] Destroying socket due to error and inability to send response.');
            res.socket.destroy(err);
        }
    },
};

const proxy = createProxyMiddleware(proxyOptions);

const server = http.createServer(app);

server.on('connect', (req, clientSocket, head) => {
    const { port, hostname } = url.parse(`http://${req.url}`);
    if (!hostname || !port) {
        console.error(`[CONNECT HANDLER] Invalid CONNECT request URL: ${req.url}`);
        clientSocket.write(`HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n`);
        clientSocket.end();
        return;
    }
    console.log(`[CONNECT HANDLER] Attempting to tunnel to ${hostname}:${port}`);
    const serverSocket = net.connect(port, hostname, () => {
        console.log(`[CONNECT HANDLER] Tunnel established to ${hostname}:${port}`);
        clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-agent: Node.js-Proxy\r\n\r\n');
        if (head && head.length) serverSocket.write(head);
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
    });
    clientSocket.on('error', (err) => {
        console.error(`[CONNECT HANDLER] Client socket error: ${err.message}`);
        if (serverSocket && !serverSocket.destroyed) serverSocket.destroy();
    });
    clientSocket.on('close', () => {
        if (serverSocket && !serverSocket.destroyed) serverSocket.destroy();
    });
    serverSocket.on('error', (err) => {
        console.error(`[CONNECT HANDLER] Target server socket error for ${hostname}:${port} - ${err.message}`);
        if (!clientSocket.destroyed) {
            if (clientSocket.writable && !clientSocket.errored) {
                clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n`);
            }
            clientSocket.end();
        }
    });
    serverSocket.on('close', () => {
        if (clientSocket && !clientSocket.destroyed) clientSocket.destroy();
    });
});

app.use('/', proxy); // Proxy middleware is now AFTER the local file serving middleware

server.listen(PORT, HOST, () => {
    console.log(`--------------------------------------------------------------------`);
    console.log(`  Express HTTP/HTTPS Proxy Server (ESM) with Modification & Local Files`);
    console.log(`  Listening on: http://${HOST}:${PORT}`);
    console.log(`  Intercepting HTTP, serving local files, and tunneling HTTPS.`);
    console.log(`--------------------------------------------------------------------`);
    console.log(`\nDebug logs will appear below:\n`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[PROCESS ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[PROCESS ERROR] Uncaught Exception:', error);
    process.exit(1);
});
