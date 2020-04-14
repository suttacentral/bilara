const proxy = require('koa-proxies');

module.exports = {
	port: 3003,
	watch: true,
	nodeResolve: true,
	appIndex: 'index.html',
	moduleDirs: ['node_modules'],
	middlewares: [
		proxy('/api', {
			target: 'http://localhost:5000',
			logs: true
		})
	]
}
