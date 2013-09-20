var localserver = 'http://localhost:32400/';
var localname = 'nobody';
var localmail = 'nobody@localhost';
var unlogin = '<user id="0" email="'+localmail+'" thumb="" username="'+localname+'" queueEmail="" queueUid="6f73d7c4f8f9cf20" cloudSyncDevice="" authenticationToken="unlogin">';
unlogin += '<username>'+localname+'</username>';
unlogin += '<email>'+localmail+'</email>';
unlogin += '<joined-at type="datetime">2000-01-01 00:00:00 UTC</joined-at>';
unlogin += '<authentication-token>unlogin</authentication-token>';
unlogin += '</user>';

var port = process.env.PORT || 3000;
var index;

var NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express'),
	request = require('request'),
	httpProxy = require('http-proxy'),
	routingProxy = new httpProxy.RoutingProxy(),
	app = express.createServer();

if (NODE_ENV === 'development') {
	var less = require('less');
	var watch = require('watch');
	var cssDirectory = './app/less';
	var cssRootFile = 'plex.less';
}

console.log('Starting Plex Client web server on port ' + port + ' in \'' + NODE_ENV + '\' environment');

function apiProxy(pattern) {
	return function (req, res, next) {
		if (req.url.match(pattern)) {

		    var newurl = '';
		    var query = req.query;

		    if( req.url.match('(/api/users/)') ) {
			newurl = 'https://'+req.headers['x-plex-proxy-host']+':'+req.headers['x-plex-proxy-port']+'/' + req.url.replace('/api/','');
			res.writeHead('ContentType: text/xml');
			res.end(unlogin);

		    }
		    
		    else {
			newurl = localserver;
			newurl += req.url.replace(/(\/api\/pms\/)|(\/api\/)/,'');
			newurl = newurl.split('?')[0];
			req.headers = undefined;
			query = undefined;
		    }

		    console.log('proxying from');
		    console.log(' '+req.url);
		    req.url = newurl;
		    console.log('to');
		    console.log(' '+req.url);

		    var reqOpts = {
			rejectUnauthorized: false,
			headers: req.headers,
			method: req.method,
			qs: query,
			url: newurl
		    };

		    var pr = request(reqOpts);
		    pr.pipe(res);

		} else {
		    return next();
		}
	};
}

app.configure(function () {
	app.use(express.methodOverride());
	app.use(apiProxy(/\/api/));
	app.use(express.bodyParser());
	app.use(express.static(__dirname));
	app.use(express.errorHandler({
		dumpExceptions: true, 
		showStack: true
	}));
	app.use(app.router);
    	app.use(require('connect-restreamer')());
});

switch (NODE_ENV) {
	case 'production':
		index = 'https://plex.herokuapp.com/index.html';
		break;
	case 'development':
		if (watch) {
			console.log('Development CSS processing active, monitoring "' + cssRootFile + '" in "' + cssDirectory + '"');

			var parser = new less.Parser({
				paths: [cssDirectory],
				filename: './app/less/plex.less	'
			});

			var parse = function () {
				parser.parse('', function (error, tree) {
					if (error) return console.log(error);
					console.log(tree.toCSS());
				});
			}

			watch.createMonitor(cssDirectory, function (monitor) {
				monitor.on("created", function (file, stat) {
					console.log('CSS processing detected new file "' + file + '", generating new css file');
					parse();
				});
				monitor.on("changed", function (file, current, previous) {
					console.log('CSS processing detected file change "' + file + '", generating new css file');
					parse();
				});
				monitor.on("removed", function (file, stat) {
					console.log('CSS processing detected deleted file "' + file + '", generating new css file');
					parse();
				});
			});
		}
	default:
		index = '/app/index-dev.html';
		break;
}

app.get('/', function (req, res) {
	res.redirect(index);
});


app.listen(port);
