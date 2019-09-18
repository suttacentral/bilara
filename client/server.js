program = require('commander');
prpl = require('prpl-server');
express = require('express');

const proxy = require('express-http-proxy');

const app = express();

program
    .version('0.1', '-v', '--version')
    .option('-d, --dev', 'Use development mode')
    .option('-p, --port [port]', 'Run on [port]', '8080')
    .option('-x, --proxy-port [number]', 'Port to proxy API requests to', 5000);

program.parse(process.argv);

console.log(program);
console.log(program.port, program.proxyPort);

// These endpoints are currently delegated to python
app.use(['/api', '/auth', '/authorized', '/import', '/export', '/user', '/login', '/logout', '/webhook'], proxy(`http://localhost:${program.proxyPort}`, {
    proxyReqPathResolver: function (req) {
        return req.originalUrl;
    },
    preserveHostHdr: true,
    limit: '100mb'
}));

// app.get('/api/launch', (req, res, next) => res.send('boom'));

if (program.dev) {

} else {
    app.use(express.static('build'));

    app.use('/*', prpl.makeHandler('./build', {
        builds: [
            {name: 'esm-bundled', browserCapabilities: ['es2015', 'modules']},
            {name: 'es6-bundled', browserCapabilities: ['es2015', 'push']},
            {name: 'es5-bundled'}
        ]
    }));

    app.listen(program.port);
}