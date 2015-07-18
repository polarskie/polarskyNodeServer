var http = require('http');
var util = require('util');
var fs   =   require('fs');
var server=http.createServer();

var fs = require('fs');

function quoting(str) {
	var r=new Array();
	var i=new Array();
	var last=0;
	var now=0;
	if (str==='') {return '';}
	while ((now=str.indexOf("'", last))!=-1)
	{
		r.push(str.slice(last, now))
		r.push("''");
		last=now+1;
	}
	r.push(str.slice(last));
	return r.join("");
}

function adjustKeyword(keyword)
{
	var r=new Array();
        r.push('%');
	for(var i=0;i<keyword.length;++i)
	{
		if(keyword.charAt(i)==' ')
			r.push('%');
		else
			r.push(keyword.charAt(i));
	}
        r.push('%');
	return r.join('');
}

function decodeUrl(str)
{
	var start=1+str.indexOf('?');
	var attr=new Object();
	while(str.indexOf('=', start)!=-1)
	{
		attr[str.slice(start, str.indexOf('=', start))]
			=
				str.slice(str.indexOf('=', start)+1, start=(str.indexOf('&', start)==-1?str.length:str.indexOf('&', start)));
		start++;
	}
	return attr;
}

function decodePost(str) {
	var start=0;
	var attr=new Object();
	while(str.indexOf('=', start)!=-1)
	{
		attr[str.slice(start, str.indexOf('=', start))]
			=
				str.slice(str.indexOf('=', start)+1, start=(str.indexOf('&', start)==-1?str.length:str.indexOf('&', start)));
		start++;
	}
	return attr;
}

function onRequest(req, res) {
	if(req.url.length<=1)
	{
		var reFile=fs.createReadStream('index.html');
		reFile.pipe(res);
	}
	else {
		var path=req.url.slice(1);
		var t=path.charAt(0);
		if (t=='/'||t=='.') { res.end("dont try haking me!!"); }
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
server.listen(801);
