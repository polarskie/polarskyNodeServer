/**
 * Created by polarsky on 2015/7/28.
 */
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
    var req = https.request(this.aTokenOptions, function(res) {
        res.on('data', function(d) {
            //console.log(d.toString())
            var jr=JSON.parse(d.toString());
            console.log(util.inspect(jr));
            if(!jr.errcode)
            {
                console.log('NO ERR');
                this.access_tocken=jr.access_token;
                var ws=fs.createWriteStream(this.id, {'flags': 'w', 'mode': 0777});
                ws.write(new Buffer(this.access_tocken));
                ws.on('drain', function(){
                    ws.end();
                    ws=null;
                });
                if(!this.ticketRefreshing)
                {
                    this.ticketRefreshing=true;
                    this.refreshTicket();
                }
            }
        });
    });
    req.end();
    req.on('error', function(e) {
        console.error(e);
    });
    setTimeout(this.refreshAToken, 3600000);
};

Token.prototype.refreshTicket=function (){
    this.ticketOptions.path='/cgi-bin/ticket/getticket?access_token='+this.access_token+'&type=jsapi';
    var req = https.request(this.ticketOptions, function(res) {
        res.on('data', function(d) {
            //console.log(d.toString())
            var jr=JSON.parse(d.toString());
            console.log(util.inspect(jr));
            if(jr.errcode==0)
            {
                console.log('NO ERR');
                this.jsapi_ticket=jr.ticket;
            }
        });
    });
    req.end();
    req.on('error', function(e) {
        console.error(e);
    });
    setTimeout(this.refreshTicket, 3600000);
};

Token.prototype.start=function()
{
    this.refreshAToken();
};