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
		var t=path.charAt(0);
		if (t=='/'||t=='.') { res.end("dont try hacking me!!"); }
		else
		{
			fs.stat(path, function(err, stats){
				console.log(stats.mtime);
				console.log(stats.ctime);
				console.log(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()));
				console.log(req.headers['if-modified-since']);
				console.log(path);
				if (!req.headers['if-modified-since']) {
					res.writeHead(200, {
						'Last-Modified': (new Date(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()))).getTime()});
					fs.createReadStream(path).pipe(res);
				}
				else if(Math.max((new Date(stats['mtime'])).getTime(), (new Date(stats['ctime'])).getTime()) > req.headers['if-modified-since'])
				{
					res.writeHead(200, {'last-modified': (new Date()).getTime()});
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
sqlClient.query('use acgwiki;');
server.on('request', onRequest);
server.listen(80);
