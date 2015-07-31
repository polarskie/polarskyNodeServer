var http = require('http');
var https = require('https');
var util = require('util');
var fs   =   require('fs');
var crypto = require('crypto');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var exec=require('child_process').exec;
var access_tocken;
var jsapi_ticket;
var charset="abcdefghijklmnopqrstuvwxyz";
var wechatTicketList=[];

var ticketRefreshing=false;
var aTokenOptions = {
	hostname: 'api.weixin.qq.com',
	port: 443,
	path: '/cgi-bin/token?grant_type=client_credential&appid=wx26c652b1b427bcfd&secret=www',
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
				var ws=fs.createWriteStream('accesstoken', {'flags': 'w', 'mode': 0777});
				ws.write(new Buffer(access_tocken));
				ws.on('drain', function(){
					ws.end();
					ws=null;
				});
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
	setTimeout(refreshAToken, 7200000);
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
	setTimeout(refreshTicket, 7200000);
}
//refreshAToken();





function Token(appid, secret, id)
{
	this.appid=appid;
	this.secret=secret;
	this.id=id;
	this.refreshing=false;
	this.access_token='';
	this.aTokenOptions = {
		hostname: 'api.weixin.qq.com',
		port: 443,
		path: '/cgi-bin/token?grant_type=client_credential&appid='+this.appid+'&secret='+this.secret,
		method: 'GET'
	};
	this.ticketOptions = {
		hostname: 'api.weixin.qq.com',
		port: 443,
		path: '/cgi-bin/ticket/getticket?access_token='+this.access_token+'&type=jsapi',
		method: 'GET'
	};
}

Token.prototype.refreshAToken =function(){
	var me=this;
	var req = https.request(this.aTokenOptions, function(res) {
		res.on('data', function(d) {
			//console.log(d.toString())
			var jr=JSON.parse(d.toString());
			console.log(util.inspect(jr));
			if(!jr.errcode)
			{
				console.log('NO ERR');
				me.access_token=jr.access_token;
				var ws=fs.createWriteStream(me.id, {'flags': 'w', 'mode': 0777});
				ws.write(new Buffer(me.access_token));
				ws.on('drain', function(){
					ws.end();
					ws=null;
				});
				if(!me.ticketRefreshing)
				{
					me.ticketRefreshing=true;
					me.refreshTicket();
				}
			}
		});
	});
	req.end();
	req.on('error', function(e) {
		console.error(e);
	});
	setTimeout(this.refreshAToken, 7200000);
};

Token.prototype.refreshTicket=function (){
	var me = this;
	console.log(this.acc)
	this.ticketOptions.path='/cgi-bin/ticket/getticket?access_token='+this.access_token+'&type=jsapi';
	var req = https.request(this.ticketOptions, function(res) {
		res.on('data', function(d) {
			//console.log(d.toString())
			var jr=JSON.parse(d.toString());
			console.log(util.inspect(jr));
			if(jr.errcode==0)
			{
				console.log('NO ERR');
				me.jsapi_ticket=jr.ticket;
			}
		});
	});
	req.end();
	req.on('error', function(e) {
		console.error(e);
	});
	setTimeout(this.refreshTicket, 7200000);
};

Token.prototype.start=function()
{
	this.refreshAToken();
};
var testAcc=new Token('wxee703ec8c8670ca9', '932e32e53ceec9ffa46277734b450c33', 'test.at');
var breezeAcc=new Token('wx26c652b1b427bcfd', '43c0623c4ade955da363cc0258f7287a', 'breeze.at')
testAcc.start();
breezeAcc.start();




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
function generateSignature(url, timestamp, nonceStr, ticket)
{
	var fourTuple=new Array();
	fourTuple.push("jsapi_ticket="+ticket);
	fourTuple.push("noncestr="+nonceStr);
	fourTuple.push("timestamp="+timestamp);
	fourTuple.push("url="+url);
	var content=fourTuple.join('&');
	console.log('string1 is: '+content);
	var sha1 = crypto.createHash('sha1');
	sha1.update(content);
	return sha1.digest('hex');
}

function getParameter(data)
{
	var paraStr=(new String(data));
	paraStr=paraStr.slice(paraStr.indexOf('?')==-1?0:paraStr.indexOf('?')+1);
	var arr=paraStr.split('&');
	var r=new Object();
	for(var i in arr)
	{
		r[arr[i].slice(0, arr[i].indexOf('='))] =
			arr[i].slice(arr[i].indexOf('=')+1);
	}
	return r;
}

var server=http.createServer();

function onRequest(req, res) {
	console.log('dataget!');
	if(req.url.length<=1)
	{
		req.on("data", function(data){
			console.log("--------------------------------\n----------------------------------")
			console.log(data.toString());
		});
		var reFile=fs.createReadStream('index.html');
		reFile.pipe(res);
	}

	//special entry for wechat messages
	else if(req.url.indexOf('wechat.php')==1)
	{
		req.on('data', function(data){
			var doc = new dom().parseFromString(data.toString());
			var openid = xpath.select("//FromUserName/text()", doc).toString().cutC();
			exec('curl -G -d access_token='+access_tocken+' -d openid='+openid+' https://api.weixin.qq.com/cgi-bin/user/info',
				function(err, stdout, stderr){
					var nn=JSON.parse(stdout.toString())['nickname'];
					res.end('<xml>\
				<ToUserName>'+xpath.select("//FromUserName/text()", doc).toString().cutC()+'</ToUserName>\
			<FromUserName>'+xpath.select("//ToUserName/text()", doc).toString().cutC()+'</FromUserName>\
			<CreateTime>'+(new Date()).getTime()+'</CreateTime>\
			<MsgType><![CDATA[text]]></MsgType>\
			<Content><![CDATA[测试页面：http://www.polarsky.cc/wechatTest.html?openid='+openid+'&nickname='+nn+' 会不定期推送更新，欢迎访问！]></Content>\
			</xml>');
				});
		});
	}
	else if(req.url.indexOf('breeze.php')==1)
	{
		req.on('data', function(data){
			var doc = new dom().parseFromString(data.toString());
			var openid = xpath.select("//FromUserName/text()", doc).toString().cutC();
			exec('curl -G -d access_token='+access_tocken+' -d openid='+openid+' https://api.weixin.qq.com/cgi-bin/user/info',
				function(err, stdout, stderr){
					var nn=JSON.parse(stdout.toString())['nickname'];
					res.end('<xml>\
				<ToUserName>'+xpath.select("//FromUserName/text()", doc).toString().cutC()+'</ToUserName>\
			<FromUserName>'+xpath.select("//ToUserName/text()", doc).toString().cutC()+'</FromUserName>\
			<CreateTime>'+(new Date()).getTime()+'</CreateTime>\
			<MsgType><![CDATA[text]]></MsgType>\
			<Content><![CDATA[测试页面：http://www.polarsky.cc/wechatTest.html?openid='+openid+'&nickname='+nn+' 会不定期推送更新，欢迎访问！]></Content>\
			</xml>');
				});
		});
	}
	else if(req.url.indexOf('upload')==1)
	{
		req.on("data", function(data){
			var ws=fs.createWriteStream('uploaded', {'flags': 'w', 'mode': 0777});
			ws.on('drain', function(){
				ws.end();
				ws=null;
			});
			ws.write(data);
		});
	}
	else if(req.url.indexOf('score')==1)
	{
		req.on("data", function (data) {
			res.end();
			var newScore=getParameter(data);
			request('http://www.weixingate.com/wgate_user.php?wgateid='+newScore['wgateid'], function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var perInfo=JSON.parse(body.toString());

					console.log(util.inspect(newScore));
					console.log(util.inspect(perInfo));
					var rs=fs.createReadStream('ranking');
					newScore['nickname']=perInfo['nickname'];
					rs.on('data', function(data){
						var ranking=JSON.parse(data.toString());
						var inserted=false;
						for(var i=0;i<ranking.length;++i)
						{
							if(parseInt(ranking[i].score)<parseInt(newScore.score))
							{
								ranking.splice(i, 0, newScore);
								inserted=true;
								break;
							}
						}
						if(!inserted)
						{
							ranking.splice(i, 0, newScore);
						}
						var ws=fs.createWriteStream('ranking', {'flags': 'w', 'mode': 0777});
						ws.on('drain', function(){
							ws.end();
							ws=null;
						});
						ws.write(new Buffer(JSON.stringify(ranking)));
					});

				}
			});
		})
	}
	else if(req.url.indexOf('ranking')==1)
	{
		var wGateId=getParameter(req.url)['wgateid'];
		if(wGateId) {
			request('http://www.weixingate.com/wgate_user.php?wgateid=' + wGateId, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var nickname = JSON.parse(body)['nickname'];
					var rs = fs.createReadStream('ranking');
					rs.on('data', function (data) {
						var ranking = JSON.parse(data.toString());
						ranking.push(nickname);
						res.end(JSON.stringify(ranking));
						return;
					});
				}
			});
		}
		else
		{
			var rs = fs.createReadStream('ranking');
			rs.pipe(res);
		}
	}
	//else, a ture file is needed
	else {
		var path=req.url.slice(1, req.url.indexOf('?')==-1?req.url.length:req.url.indexOf('?'));
		var parameters=req.url.slice(req.url.indexOf('?')==-1?req.url.length:req.url.indexOf('?')+1, req.url.length);
		var t=path.indexOf('..');
		var fileType=path.slice(path.lastIndexOf('.')+1);
		if (path.charAt(0)=='/'||t!=-1) { res.end("dont try hacking me!!"); }

		//special entry for wechat web pages
		else if (path.indexOf('wechat')!=-1) {
			var mainUrl="http://www.polarsky.cc"+req.url.slice(0, req.url.indexOf('#')==-1?req.url.length:req.url.indexOf('#'));
			var timestamp=parseInt((new Date()).getTime());
			var nonceStr=generateNonce();
			console.log("the url now is "+mainUrl);
			console.log("the timestamp now is "+timestamp);
			console.log("the nonceStr now is "+nonceStr);
			console.log("the jsapi_ticket now is "+testAcc.jsapi_ticket);
			var signature=generateSignature(mainUrl, timestamp, nonceStr, testAcc.jsapi_ticket);
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
		else if (path.indexOf('wechal')!=-1)
		{
			var mainUrl="http://www.polarsky.cc"+req.url.slice(0, req.url.indexOf('#')==-1?req.url.length:req.url.indexOf('#'));
			console.log(req.url);
			console.log((getParameter(req.url))['ticket']);
			var ticket=(getParameter(req.url))['ticket'];
			var firstTime=true;
			for(var whichTicket in wechatTicketList)
			{
				if(wechatTicketList[whichTicket]==ticket)
				{
					firstTime=false;
					break;
				}
			}
			if(firstTime)
			{
				var nonce=generateNonce();
				wechatTicketList.push(nonce);
				res.writeHead(302, {
					'Location': 'http://www.weixingate.com/gate.php?back=http%3a%2f%2fwww.polarsky.cc%2fwechal-breezeAP' +
					'ITest.html%3fticket%3d'+nonce+'&force=1&info=basic'
					//add other headers here...
				});
				res.end();
				return;
			}
			wechatTicketList.splice(whichTicket, 1);
			console.log('heree');
			var timestamp=parseInt((new Date()).getTime()/1000);
			var nonceStr=generateNonce();
			console.log("the url now is "+mainUrl);
			console.log("the timestamp now is "+timestamp);
			console.log("the nonceStr now is "+nonceStr);
			console.log("the jsapi_ticket now is "+breezeAcc.jsapi_ticket);
			var signature=generateSignature(mainUrl, timestamp, nonceStr, breezeAcc.jsapi_ticket);
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