var http = require('http');
var util = require('util');
var fs   =   require('fs');
var mysql=require('mysql');
var server=http.createServer();
var sqlClient=mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345'
	});
	
var idDistributor=19999;


var fs = require('fs');
var searchPageHead;
var searchPageTail;
var searchPageReady=false;


var displayPageHead;
var displayPageTail;
var displayPageReady=false;


var createPageHead;
var createPageTail;
var createPageReady=false;

var tableOfIdentity=['collection', 'animation', 'comic', 'game', 'music', 'chara'];

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
function generateSearchItem(sourceItem)
{
		var r=new Array();
		r.push("<section data_id='"+sourceItem.id+"'><h3>");
		r.push(sourceItem.name);
		r.push("</h3><p><span>");
		r.push(sourceItem.janame);
		r.push("</span><span>");
		r.push(sourceItem.enname);
		r.push("</span></p><p>");
		r.push(sourceItem.alias);
		r.push("</p><p>");
		r.push(sourceItem.summary);
		r.push("</p></section>");
		/*
		r.push("<section data_id='"+sourceItem.id+"'><h3 data_id='"+id+"'>");
		r.push(sourceItem.name);
		r.push("</h3><p data_id='"+id+"'><span data_id='"+id+"'>");
		r.push(sourceItem.janame);
		r.push("</span><span data_id='"+id+"'>");
		r.push(sourceItem.enname);
		r.push("</span></p><p data_id='"+id+"'>");
		r.push(sourceItem.alias);
		r.push("</p><p data_id='"+id+"'>");
		r.push(sourceItem.summary);
		/*
		r.push("</p><p hidden='true'>")
		r.push(sourceItem.id);
		r.push("</p></section>");
		*/
		//console.log(r.join(""));
		return r.join("");
		/*
	else {
		var r=new Array();
		r.push("<section><h3>");
		r.push(sourceItem.name);
		r.push("</h3><p><span>");
		r.push(sourceItem.janame);
		r.push("</span><span>");
		r.push(sourceItem.enname);
		r.push("</span></p><p>");
		r.push(sourceItem.alias);
		r.push("</p><p>");
		r.push(sourceItem.summary);
		/*
		r.push("</p><p hidden='true'>")
		r.push(sourceItem.id);
		*
		r.push("</p></section>");
		return r.join("");
	}*/
}
function generateAside(response, id, catagory, origin) {
	var query;
	var queryArr=new Array();
	if (catagory=='collection') {
		for(var i=1;i<tableOfIdentity.length;++i)
		{
			queryArr.push("select id,name,alias,janame,enname,'"+tableOfIdentity[i]+"' cata from "+tableOfIdentity[i]+' where id='+id);
		}
	}
	else {
		for (var i=1;i<tableOfIdentity.length;++i) {
			if (tableOfIdentity[i]==catagory) break;
		}
		queryArr.push("select id,name,alias,janame,enname,'"+catagory+"' cata from "+catagory+' where id='+origin+" and id<>"+id);
		for (var j=0;j<tableOfIdentity.length;++j) {
			if (j!=i) {
				queryArr.push("select id,name,alias,janame,enname,'"+tableOfIdentity[j]+"' cata from "+tableOfIdentity[j]+' where id='+id);
			}
		}
	}
	query=queryArr.join(" union ");
	query+=';';
	console.log(query);
	sqlClient.query(
		query,
		function (err, asideResults, field) {
			console.log(util.inspect(asideResults));			
			var i=0;
			if(asideResults.length>0)
			{
				var tempCat=asideResults[0].cata;
				while (i<asideResults.length) {
					response.write("<h2 data_cata='"+tempCat+"'>"+tempCat+":</h2>");
					while (tempCat==asideResults[i].cata)	{
						response.write(generateSearchItem(asideResults[i++]));
						if(i>=asideResults.length) break;
					}	
					if(i>=asideResults.length) break;
					tempCat=asideResults[i].cata;
				}
			}
			response.end(displayPageTail);
		}
	)
}
function generateDisplay(source) {
	var dest=new Array();
	dest.push(displayPageHead);
	for (var i in source) {
		dest.push("<section><strong>");
		dest.push(i+": ");
		dest.push("</strong>");
		dest.push(source[i]);
		dest.push("</section>")
	}
	dest.push(displayPageTail);
	return dest.join("");
}
function generateSonOption(response, sonName, catagory, ajax) {
	sqlClient.query("desc "+sonName,
		function (err, results, field) {
			for (var i in results) {
				var rows;
				if (results[i].Field=="id"||results[i].Field=="origin") {}
				else if (results[i].Type.indexOf("varchar")!=-1&&(rows=parseInt(results[i].Type.slice(8)))>128) {
					response.write("<h3 class='"+sonName+"'>"+results[i].Field+":</h3><textarea class='"+sonName+"' name='"+results[i].Field+"' cols=25 rows="+Math.min(parseInt(rows/50),20)+"></textarea>")
				}
				else if (results[i].Type.indexOf("int")!=-1) {
					response.write("<h3 class='"+sonName+"'>"+results[i].Field+":</h3><input class='"+sonName+"' name='"+results[i].Field+"' type='number' value='1'>");
				}
				else if (results[i].Type.indexOf("date")!=-1) {
					response.write("<h3 class='"+sonName+"'>"+results[i].Field+":</h3><input class='"+sonName+"' name='"+results[i].Field+"' type='date'>");
				}
				else {
					//console.log("<h3 class='"+sonName+"' "+(hide?"hidden":"")+">"+results[i].Field+":</h3><input "+hide?"hidden":""+" class='"+sonName+"' name='"+results[i].Field+"' type='text'>");
					response.write("<h3 class='"+sonName+"'>"+results[i].Field+":</h3><input class='"+sonName+"' name='"+results[i].Field+"' type='text'>");
				}
			}
			if (!ajax) {
				response.write("<input name='catagory' type='text' hidden='true' value='"+catagory+"'>");
				response.end(createPageTail);
			}
			else {
				response.end();
			}
		});
}

function generateCreatePage(results, response, catagory) {
	response.write(createPageHead);
	//response.write("<span id='serverMsg' data_cata='"+catagory+"'></span>");
	if (catagory!="collection") {
		response.write("<h3>search and choose the collection first:<h3><input name='origin' type='text'></input><span id='searchColl'>search</span>");
	}
	var hasSon=false;
	for (var i in results) {
		if (results[i].Field=="type") {
			hasSon=true;
			sqlClient.query(
				"select son from inherit where father='"+catagory+"';",
				function (err, sonResults, sonField) {
					for (var i in results) {
					var rows;
					/*
					if (results[i].Field=="id"||results[i].Field=="origin") {}
					else if (results[i].Type.indexOf("varchar")!=-1&&(rows=parseInt(results[i].Type.slice(8)))>128) {
						response.write("<h3>"+results[i].Field+":</h3><textarea name='"+results[i].Field+"' cols=25 rows="+Math.min(parseInt(rows/50),20)+"></textarea>")
					}
					else {
						response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='text'>");
					}
					*/
					if (results[i].Field=="id"||results[i].Field=="origin") {}
					else if (results[i].Type.indexOf("varchar")!=-1&&(rows=parseInt(results[i].Type.slice(8)))>128) {
						response.write("<h3>"+results[i].Field+":</h3><textarea name='"+results[i].Field+"' cols=25 rows="+Math.min(parseInt(rows/50),20)+"></textarea>")
					}
					else if (results[i].Type.indexOf("int")!=-1) {
						response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='number' value='1'>");
					}
					else if (results[i].Type.indexOf("date")!=-1) {
						response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='date'>");
					}
					else {
						response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='text'>");
					}
				}
				response.write("<h3>Select which subclass is it in:</h3><select name='sonName' onchange='retrieveSonOptions(event)'>");
				for(var i in sonResults)
				{
					if (i==0) {
						response.write("<option value='"+sonResults[i].son+"' selected='true'>"+sonResults[i].son+"</option>");
					}
					else {
						response.write("<option value='"+sonResults[i].son+"'>"+sonResults[i].son+"</option>")
					}
				}
				response.write("</select>");
				//for (var i=0;i<sonResults.length;++i) {
				generateSonOption(response, sonResults[0].son, catagory);
				//}
			});
			break;
		}
	}
	if (!hasSon) {
		for (var i in results) {
			var rows;
			if (results[i].Field=="id"||results[i].Field=="origin") {}
			else if (results[i].Type.indexOf("varchar")!=-1&&(rows=parseInt(results[i].Type.slice(8)))>128) {
				response.write("<h3>"+results[i].Field+":</h3><textarea name='"+results[i].Field+"' cols=25 rows="+Math.min(parseInt(rows/50),20)+"></textarea>")
			}
			else if (results[i].Type.indexOf("int")!=-1) {
				response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='number' value='1'>");
			}
			else if (results[i].Type.indexOf("date")!=-1) {
				response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='date'>");
			}
			else {
				response.write("<h3>"+results[i].Field+":</h3><input name='"+results[i].Field+"' type='text'>");
			}
		}
		response.write("<input name='catagory' type='text' hidden='true' value='"+catagory+"'>");
		response.end(createPageTail);
	}
}

fs.stat('search.html', function(err, stats) {
	var searchPageBuf=new Buffer(stats.size);
	fs.open('search.html', 'r', function(err, fd) {
		if(err) console.log(err);
		fs.read(fd, searchPageBuf, 0, stats.size, 0, function(err, readBytes) {
			if(err) throw err;
			//else console.log(searchPageBuf.toString);
			var searchPageStr=searchPageBuf.toString();
			var flagIndex=searchPageStr.indexOf('@INSERT_HERE');
			searchPageHead=searchPageStr.slice(0, flagIndex);
			searchPageTail=searchPageStr.slice(flagIndex+12);
			//console.log(searchPageHead,'\n\n\n\n',searchPageTail);
			searchPageReady=true;
			fs.close(fd);
		});
	});
});

fs.stat('display.html', function(err, stats) {
	var displayPageBuf=new Buffer(stats.size);
	fs.open('display.html', 'r', function(err, fd) {
		if(err) console.log(err);
		fs.read(fd, displayPageBuf, 0, stats.size, 0, function(err, readBytes) {
			if(err) throw err;
			//else console.log(displayPageBuf.toString);
			var displayPageStr=displayPageBuf.toString();
			var flagIndex=displayPageStr.indexOf('@INSERT_HERE');
			displayPageHead=displayPageStr.slice(0, flagIndex);
			flagIndex=displayPageStr.lastIndexOf('@INSERT_HERE');
			displayPageTail=displayPageStr.slice(flagIndex+12);
			//console.log(displayPageHead,'\n\n\n\n',displayPageTail);
			displayPageReady=true;
			fs.close(fd);
		});
	});
});

fs.stat('create.html', function(err, stats) {
	var createPageBuf=new Buffer(stats.size);
	fs.open('create.html', 'r', function(err, fd) {
		if(err) console.log(err);
		fs.read(fd, createPageBuf, 0, stats.size, 0, function(err, readBytes) {
			if(err) throw err;
			//else console.log(createPageBuf.toString);
			var createPageStr=createPageBuf.toString();
			var flagIndex=createPageStr.indexOf('@INSERT_HERE');
			createPageHead=createPageStr.slice(0, flagIndex);
			flagIndex=createPageStr.lastIndexOf('@INSERT_HERE');
			createPageTail=createPageStr.slice(flagIndex+12);
			//console.log(createPageHead,'\n\n\n\n',createPageTail);
			createPageReady=true;
			fs.close(fd);
		});
	});
});



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
