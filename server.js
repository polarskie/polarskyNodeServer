var http = require('http');
var https = require('https');
var util = require('util');
var fs   =   require('fs');
var crypto = require('crypto');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var access_tocken;
var jsapi_ticket;
var charset="abcdefghijklmnopqrstuvwxyz";

var ticketRefreshing=false;
var aTokenOptions = {
	hostname: 'api.weixin.qq.com',
	port: 443,
	path: '/cgi-bin/token?grant_type=client_credential&appid=wxee703ec8c8670ca9&secret=932e32e53ceec9ffa46277734b450c33',
	method: 'GET'
};

var ticketOptions = {
	hostname: 'api.weixin.qq.com',
	port: 443,
	path: '/cgi-bin/ticket/getticket?access_token=jFlQtrYzfI-cNeguQ04fL3JMupuR6mS5sz1l61vWxgUnfIPLuC7IlQzDtgWRQOYoNeAXnzxffcsKZWOU9Geu9KhjPfd2eY0VWP6wv-0vq7I&type=jsapi',
	method: 'GET'
};

function refreshAToken(){
	var req = https.request(aTokenOptions, function(res) {

		res.on('data', function(d) {
			//console.log(d.toString())
			var jr=JSON.parse(d.toString());
			console.log(util.inspect(jr));
			if(!jr.errcode)
			{
				console.log('NO ERR');
				access_tocken=jr.access_token;
				ticketOptions.path='/cgi-bin/ticket/getticket?access_token='+jr.access_token+'&type=jsapi';
				if(!ticketRefreshing)
				{
					ticketRefreshing=true;
					refreshTicket();
				}
			}
		});
	});
	req.end();
	req.on('error', function(e) {
		console.error(e);
	});
	setTimeout(refreshAToken, 3600000);
}
function refreshTicket(){
	var req = https.request(ticketOptions, function(res) {

		res.on('data', function(d) {
			//console.log(d.toString())
			var jr=JSON.parse(d.toString());
			console.log(util.inspect(jr));
			if(jr.errcode==0)
			{
				console.log('NO ERR');
				jsapi_ticket=jr.ticket;
			}
		});
	});
	req.end();
	req.on('error', function(e) {
		console.error(e);
	});
	setTimeout(refreshTicket, 3600000);
}
refreshAToken();

String.prototype.insertData=function (data)
{
	var loc=this.indexOf('<!DATA_HERE>');
	var head=this.slice(0, loc);
	var tail=this.slice(loc+'<!DATA_HERE>'.length);
	var dataArray=new Array();
	for(var i in data)
	{
		dataArray.push(i+'="'+data[i].toString()+'";');
	}
	return head+dataArray.join('')+tail;
}
String.prototype.cutC=function ()
{
	if(this.indexOf('<![CDATA[')!=-1)
	{
		return this.slice(this.indexOf('<![CDATA[')+9, -3);
	}
	return this.toString();
}

function generateNonce()
{
	var r=new Array();
	for(var i=0;i<16;++i)
		r.push(charset.charAt(Math.random()*26));
	return r.join('');
}
function generateSignature(url, timestamp, nonceStr)
{
	var fourTuple=new Array();
	fourTuple.push("jsapi_ticket="+jsapi_ticket);
	fourTuple.push("noncestr="+nonceStr);
	fourTuple.push("timestamp="+timestamp);
	fourTuple.push("url="+url);
	var content=fourTuple.join('&');
	console.log('string1 is: '+content);
	var sha1 = crypto.createHash('sha1');
	sha1.update(content);
	return sha1.digest('hex');
}
var server=http.createServer();

function onRequest(req, res) {
	if(req.url.length<=1)
	{
		var reFile=fs.createReadStream('index.html');
		reFile.pipe(res);
	}

	//special entry for wechat messages
	else if(req.url.indexOf('wechat.php')==1)
	{
		req.on('data', function(data){
			var doc = new dom().parseFromString(data.toString());
			var nodes = xpath.select("//title", doc);
			console.log(data.toString());
			console.log(xpath.select("//Content/text()", doc).toString().cutC());
			res.end('<xml>\
				<ToUserName>'+xpath.select("//FromUserName/text()", doc).toString().cutC()+'</ToUserName>\
			<FromUserName>'+xpath.select("//ToUserName/text()", doc).toString().cutC()+'</FromUserName>\
			<CreateTime>'+(new Date()).getTime()+'</CreateTime>\
			<MsgType><![CDATA[text]]></MsgType>\
			<Content><![CDATA[还在做一些准备，请等等...]]></Content>\
			</xml>');
		});
	}
	else {
		var path=req.url.slice(1, req.url.indexOf('?')==-1?req.url.length:req.url.indexOf('?'));
		var parameters=req.url.slice(req.url.indexOf('?')==-1?req.url.length:req.url.indexOf('?')+1, req.url.length);
		var t=path.indexOf('..');
		var fileType=path.slice(path.lastIndexOf('.')+1);
		if (path.charAt(0)=='/'||t!=-1) { res.end("dont try hacking me!!"); }

		//special entry for wechat web pages
		else if (path.indexOf('wechat')!=-1) {
			var mainUrl="http://www.polarsky.cc"+req.url.slice(0, req.url.indexOf('#')==-1?req.url.length:req.url.indexOf('#'));
			var timestamp=(new Date()).getTime();
			var nonceStr=generateNonce();
			console.log("the url now is "+mainUrl);
			console.log("the timestamp now is "+timestamp);
			console.log("the nonceStr now is "+nonceStr);
			console.log("the jsapi_ticket now is "+jsapi_ticket);
			var signature=generateSignature(mainUrl, timestamp, nonceStr);
			console.log("the signature now is "+signature);
			fs.stat(path, function(err, stats) {
				console.log(path);
				console.log(err);
				if(err)
				{
					res.end("Your querying page does not exist");
					return;
				}
				var wechatBuf=new Buffer(stats.size);
				fs.open(path, 'r', function(err, fd) {
					if(err) console.log(err);
					fs.read(fd, wechatBuf, 0, stats.size, 0, function(err, readBytes) {
						if(err) throw err;
						//else console.log(searchPageBuf.toString);
						res.end(wechatBuf.toString().insertData({'timestamp': timestamp,'nonceStr': nonceStr,'signature': signature}));
						fs.close(fd);
					});
				});
			});

		}
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
server.listen(80);

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		process.stdout.write('data: ' + chunk);
	}
});

process.stdin.on('end', function() {
	process.stdout.write('end');
});