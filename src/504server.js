import http from 'http'
const content = `<!DOCTYPE html>
<html>

<head>
    <title>504 Gateway Timeout</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no" />
    <style>
        html {
            color-scheme: light dark;
        }

        body {
            padding: 2em;
            max-width: 35em;
            margin: 0 auto;
            text-align: center;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
</head>

<body>
    <h1>504 Gateway Timeout</h1>
    <hr>
    <p>baka-engine/1.0.0</p>
</body>

</html>`
const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ====`);
    console.log(`${req.method} ${req.url} HTTP/${req.httpVersion}`);
    for(let k in req.headers){
        console.log(`${k}: ${req.headers[k]}`);
    }
    const delay = Math.random() * 5000 + 5000; // 5000-10000毫秒

    setTimeout(() => {
        res.statusCode = 504;
        res.setHeader('Content-Type','text/html')
        res.setHeader('Content-Length', content.length)
        res.end(content);
    }, delay);
});

export default function (port = 8504, host = '0.0.0.0') {
    server.listen(port, host, () => {
        console.log(`listen ${host}:${port}`);
    });
}
