import express from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import http from 'http'; // Required for the CONNECT method handling
import net from 'net';   // Required for the CONNECT method handling
import url from 'url';   // Required for the CONNECT method handling
import zlib from 'zlib'; // For handling compressed responses (gzip, deflate)
import fs from 'fs';     // For reading/writing local files
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

// --- Configuration for Local File Serving & Response Saving ---

// 1. Serve local JSON files based on URL patterns
//    Each object: { urlPattern: string | RegExp, localFilePath: string (relative to 'local_files' directory) }
const localFileMappings = [
    {
        urlPattern: '/api/local/mydata', // Matches if URL *contains* this string
        localFilePath: 'mydata.json'
    },
    {
        urlPattern: '/api/local/another-set',
        localFilePath: 'another.json'
    },
    // Example with RegExp:
    // {
    //     urlPattern: /^\/api\/users\/(\d+)$/, // Matches e.g. /api/users/123
    //     localFilePath: (matches) => `user_data/user_${matches[1]}.json` // Function to dynamically determine file path
    // }
];
const LOCAL_FILES_DIR = path.join(__dirname, 'local_files');
if (!fs.existsSync(LOCAL_FILES_DIR)) {
    fs.mkdirSync(LOCAL_FILES_DIR, { recursive: true });
}


// 2. Save JSON responses to local files based on URL patterns
//    Each object: { urlPattern: string | RegExp, saveFilePath: string (relative to 'saved_responses' directory, can include placeholders like {timestamp}) }
const responseSaveMappings = [
    {
        urlPattern: '/api/external/capturethis', // Matches if URL *contains* this string
        // {timestamp} will be replaced with YYYY-MM-DD_HH-mm-ss
        // {date} will be replaced with YYYY-MM-DD
        // {time} will be replaced with HH-mm-ss
        // {uuid} will be replaced with a v4 UUID
        // {filename} will be extracted from the last part of the URL path
        saveFilePath: 'captured_data/external_api_response_{filename}_{timestamp}.json'
    },
    {
        urlPattern: '/api/another/trackme',
        saveFilePath: 'tracking_data/tracked_{uuid}.json'
    }
];
const SAVED_RESPONSES_DIR = path.join(__dirname, 'saved_responses');
if (!fs.existsSync(SAVED_RESPONSES_DIR)) {
    fs.mkdirSync(SAVED_RESPONSES_DIR, { recursive: true });
}


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

// --- Custom Middleware to Serve Local JSON Based on URL Mappings ---
app.use((req, res, next) => {
    for (const mapping of localFileMappings) {
        let match = false;
        let matchDetails = null;

        if (typeof mapping.urlPattern === 'string') {
            if (req.originalUrl.includes(mapping.urlPattern)) {
                match = true;
            }
        } else if (mapping.urlPattern instanceof RegExp) {
            const regexMatch = req.originalUrl.match(mapping.urlPattern);
            if (regexMatch) {
                match = true;
                matchDetails = regexMatch;
            }
        }

        if (match) {
            let relativeFilePath;
            if (typeof mapping.localFilePath === 'function') {
                relativeFilePath = mapping.localFilePath(matchDetails);
            } else {
                relativeFilePath = mapping.localFilePath;
            }
            
            const absoluteFilePath = path.join(LOCAL_FILES_DIR, relativeFilePath);

            console.log(`[LOCAL FILE SERVER] Request for ${req.originalUrl} matched pattern "${mapping.urlPattern}". Attempting to serve ${absoluteFilePath}`);

            fs.readFile(absoluteFilePath, 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        console.error(`[LOCAL FILE SERVER] File not found: ${absoluteFilePath}`);
                        res.status(404).json({ error: 'Local data not found', detail: `File ${relativeFilePath} does not exist.` });
                    } else {
                        console.error(`[LOCAL FILE SERVER] Error reading file ${absoluteFilePath}:`, err);
                        res.status(500).json({ error: 'Internal server error while serving local file.' });
                    }
                    return; // Stop further processing for this request
                }

                try {
                    JSON.parse(data); // Validate JSON
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(data);
                    console.log(`[LOCAL FILE SERVER] Successfully served ${absoluteFilePath}`);
                } catch (parseError) {
                    console.error(`[LOCAL FILE SERVER] File ${absoluteFilePath} is not valid JSON:`, parseError);
                    res.status(500).json({ error: 'Internal server error: Local file is not valid JSON.' });
                }
            });
            return; // Exit middleware as request is handled
        }
    }
    next(); // No match, proceed to proxy
});


// --- Proxy Middleware Configuration ---
const proxyOptions = {
    router: (req) => {
        // This router is for http-proxy-middleware. CONNECT requests are handled separately.
        if (req.method === 'CONNECT') {
            console.warn(`[PROXY ROUTER] CONNECT request unexpectedly reached router for: ${req.url}`);
            return `https://${req.url.split(':')[0]}`; // Fallback, should be handled by server.on('connect')
        }
        let targetUrl;
        if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
            targetUrl = req.url;
        } else {
            // For relative paths, construct absolute URL based on proxy's perspective
            const protocol = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const hostHeader = req.headers.host; // This would be the proxy's host
            targetUrl = `${protocol}://${hostHeader}${req.url}`;
            console.warn(`[PROXY ROUTER] Warning: Relative path received: ${req.url}. Constructed target: ${targetUrl}`);
        }
        console.log(`[PROXY ${req.method} ROUTER] Routing to: ${targetUrl}`);
        return targetUrl;
    },
    changeOrigin: true,
    secure: false, // Do not validate SSL certs of the target when proxying
    ws: true,      // Enable WebSocket proxying
    logLevel: 'debug', // For detailed http-proxy-middleware logs
    selfHandleResponse: true, // We will handle the response manually in onProxyRes

    onProxyReq: (proxyReq, req, res) => {
        console.log(`[HPM onProxyReq] Sending ${req.method} request to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
        proxyReq.setHeader('X-My-Proxy', 'Injecting-Header-Example');
        // console.log('[HPM onProxyReq] Added custom header X-My-Proxy');

        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-forwarded-host');
        proxyReq.removeHeader('x-forwarded-proto');

        if (req.body && Object.keys(req.body).length > 0 && req.method !== 'CONNECT') {
            // fixRequestBody is needed if body was parsed and potentially modified
            fixRequestBody(proxyReq, req);
        }
    },

    onProxyRes: (proxyRes, req, res) => {
        console.log(`[HPM onProxyRes] Received response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
        const bodyChunks = [];
        proxyRes.on('data', (chunk) => {
            bodyChunks.push(chunk);
        });

        proxyRes.on('end', () => {
            let responseBodyBuffer = Buffer.concat(bodyChunks);
            const originalHeaders = { ...proxyRes.headers };
            const contentEncoding = originalHeaders['content-encoding'];

            // Decompress if necessary
            try {
                if (contentEncoding === 'gzip') {
                    responseBodyBuffer = zlib.gunzipSync(responseBodyBuffer);
                    delete originalHeaders['content-encoding'];
                    console.log('[HPM onProxyRes] Decompressed GZIP response body.');
                } else if (contentEncoding === 'deflate') {
                    responseBodyBuffer = zlib.inflateSync(responseBodyBuffer);
                    delete originalHeaders['content-encoding'];
                    console.log('[HPM onProxyRes] Decompressed DEFLATE response body.');
                }
            } catch (decompressionError) {
                console.error('[HPM onProxyRes] Decompression error:', decompressionError);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Proxy error: Failed to decompress response.');
                return;
            }
            
            const contentType = originalHeaders['content-type'];
            let modifiedBodyBuffer = responseBodyBuffer; // Start with (potentially decompressed) original

            // --- Apply general modifications (HTML banner, JSON message) ---
            if (contentType && contentType.includes('text/html')) {
                try {
                    let htmlContent = responseBodyBuffer.toString('utf8');
                    const banner = '<div style="background-color: yellow; color: black; padding: 10px; text-align: center; position: fixed; top: 0; width: 100%; z-index: 9999;">Proxied and Modified!</div>';
                    htmlContent = htmlContent.includes('</body>') ? htmlContent.replace('</body>', `${banner}</body>`) : htmlContent + banner;
                    modifiedBodyBuffer = Buffer.from(htmlContent, 'utf8');
                    console.log('[HPM onProxyRes] Modified HTML response body (banner).');
                } catch (error) {
                    console.error('[HPM onProxyRes] Error modifying HTML for banner:', error);
                }
            } else if (contentType && contentType.includes('application/json')) {
                try {
                    let jsonContent = JSON.parse(responseBodyBuffer.toString('utf8'));
                    jsonContent.proxyGeneralMessage = "This JSON response was processed by the proxy.";
                    modifiedBodyBuffer = Buffer.from(JSON.stringify(jsonContent, null, 2), 'utf8'); // Pretty print JSON
                    console.log('[HPM onProxyRes] Modified JSON response body (general message).');
                } catch (error) {
                    console.error('[HPM onProxyRes] Error modifying JSON for general message:', error);
                }
            }

            // --- Save response to file if URL matches ---
            for (const mapping of responseSaveMappings) {
                let match = false;
                if (typeof mapping.urlPattern === 'string' && req.originalUrl.includes(mapping.urlPattern)) {
                    match = true;
                } else if (mapping.urlPattern instanceof RegExp && mapping.urlPattern.test(req.originalUrl)) {
                    match = true;
                }

                if (match && contentType && contentType.includes('application/json')) {
                    try {
                        const now = new Date();
                        const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, ''); // YYYY-MM-DDTHH-mm-ss
                        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
                        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                        const uuid = crypto.randomUUID(); // Requires Node 15.6.0+ or import { v4 as uuidv4 } from 'uuid';

                        // Extract filename from URL path (last segment)
                        const urlParts = req.originalUrl.split('?')[0].split('/');
                        const potentialFilename = urlParts[urlParts.length -1] || 'index';


                        let saveFileName = mapping.saveFilePath
                            .replace('{timestamp}', timestamp)
                            .replace('{date}', date)
                            .replace('{time}', time)
                            .replace('{uuid}', uuid)
                            .replace('{filename}', potentialFilename.replace(/[^a-zA-Z0-9_.-]/g, '_')); // Sanitize filename


                        const absoluteSavePath = path.join(SAVED_RESPONSES_DIR, saveFileName);
                        const saveDir = path.dirname(absoluteSavePath);

                        if (!fs.existsSync(saveDir)) {
                            fs.mkdirSync(saveDir, { recursive: true });
                        }
                        
                        // Save the *modified* body if JSON modification occurred, otherwise the (decompressed) original
                        const contentToSave = modifiedBodyBuffer.toString('utf8');
                        fs.writeFile(absoluteSavePath, contentToSave, 'utf8', (err) => {
                            if (err) {
                                console.error(`[RESPONSE SAVER] Error saving response to ${absoluteSavePath}:`, err);
                            } else {
                                console.log(`[RESPONSE SAVER] Successfully saved JSON response for ${req.originalUrl} to ${absoluteSavePath}`);
                            }
                        });
                    } catch (saveError) {
                        console.error(`[RESPONSE SAVER] Error preparing to save response for ${req.originalUrl}:`, saveError);
                    }
                    // Do not return; continue to send response to client
                    break; // Assuming only one save mapping should apply
                }
            }

            originalHeaders['content-length'] = Buffer.byteLength(modifiedBodyBuffer);
            originalHeaders['X-Proxy-Processed'] = 'true'; // Renamed for clarity
            
            res.writeHead(proxyRes.statusCode, originalHeaders);
            res.end(modifiedBodyBuffer);
        });

        proxyRes.on('error', (err) => {
            console.error('[HPM onProxyRes] Error from target server response stream:', err);
            if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Proxy error: Error receiving data from target server.');
        });
    },
    onError: (err, req, res, target) => {
        // ... (existing onError logic, ensure it's robust)
        console.error('[HPM onError] Error:', err.message);
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

// --- CONNECT Method Handler (for HTTPS Tunnels) ---
server.on('connect', (req, clientSocket, head) => {
    const { port, hostname } = url.parse(`http://${req.url}`); // req.url is 'hostname:port'
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
    // Basic error handling for sockets
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

app.use('/', proxy); // Proxy middleware is AFTER local file serving and other custom middleware

server.listen(PORT, HOST, () => {
    console.log(`--------------------------------------------------------------------`);
    console.log(`  Express HTTP/HTTPS Proxy Server (Advanced Features)`);
    console.log(`  Listening on: http://${HOST}:${PORT}`);
    console.log(`  Features: Modifying HTTP, Local File Serving, Response Saving, HTTPS Tunneling.`);
    console.log(`  Local files served from: ${LOCAL_FILES_DIR}`);
    console.log(`  Responses saved to: ${SAVED_RESPONSES_DIR}`);
    console.log(`--------------------------------------------------------------------`);
    console.log(`\nDebug logs will appear below:\n`);
});

// --- Process-wide Error Handlers ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('[PROCESS ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[PROCESS ERROR] Uncaught Exception:', error);
    process.exit(1); // Consider graceful shutdown
});

// For crypto.randomUUID() if not available (Node < 15.6.0), or use a library like 'uuid'
import crypto from 'crypto';
if (typeof crypto.randomUUID !== 'function') {
    // Basic polyfill for older Node versions if 'uuid' library is not used
    crypto.randomUUID = function randomUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}
