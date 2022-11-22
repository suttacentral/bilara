const proxy = require('koa-proxies');

module.exports = {
	port: 3003,
	nodeResolve: true,
	appIndex: 'index.html',
	moduleDirs: ['node_modules'],
	middlewares: [
    function dotFix(context, next) {
      if (!context.url.match(/\/api/) && context.url.match(/\.\d/)) {
        context.url = '/index.html';
      }
      return next();
    },
		proxy('/api', {
			target: 'http://localhost:5000'
		})
	]
}
