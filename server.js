var http = require('http');
var util = require('util');
var fs   =   require('fs');
var server=http.createServer();

function onRequest(req, res) {
	if(req.url.length<=1)
	{
		var reFile=fs.createReadStream('index.html');
		reFile.pipe(res);
	}
	else {
		var path=req.url.slice(1);
		var t=path.indexOf('..');
		var fileType=path.slice(path.lastIndexOf('.')+1);
		if (path.charAt(0)=='/'||t!=-1) { res.end("dont try hacking me!!"); }
		else
		{
			console.log(path);
			fs.stat(path, function(err, stats){
				if (err)
				{
					res.writeHead(404, {});
					res.end('Your querying page does not exist');
					return;
				}
				console.log(stats.mtime);
				console.log(stats.ctime);
				console.log(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()));
				console.log(req.headers['if-modified-since']);
				console.log(path);
				if (!req.headers['if-modified-since']) {
					if (fileType=='html') {
						res.writeHead(200, {
							'Last-Modified': (new Date(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()))).getTime(),
							'Content-Type': 'text/html'
						});
					}
					else
					{
						res.writeHead(200, {
							'Last-Modified': (new Date(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()))).getTime()
						});
					}
					fs.createReadStream(path).pipe(res);
				}
				else if(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()) > req.headers['if-modified-since'])
				{
					if (fileType=='html')
					{
						res.writeHead(200, {'last-modified': (new Date()).getTime(), 'Content-Type': 'text/html'});
					}
					else
					{
						res.writeHead(200, {'last-modified': (new Date()).getTime()});
					}
					fs.createReadStream(path).pipe(res);
					console.log('200');
				}
				else
				{
					console.log('304');
					res.writeHead(304, {});
					res.end();
				}
			});
		}
	}
}
server.on('request', onRequest);
server.listen(8011);
