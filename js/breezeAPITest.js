/**
 * Created by polarsky on 15/7/26.
 */
var localImageList=[];
var serverImageList=[];
var localVoiceList=[];
var serverVoiceList=[];
var GtimeRest=false;
var challengeId;
var g_count;

$(document).on("pageinit","#challenge",function(){
    alert(getParameter('wgateid'));
    alert(getParameter('ticket'));
    wx.error(function(res){
        $('jumptofollow').click();
        alert('opps');
        //$('#guanzhu').slideDown('slow', function(){alert('请先关注我（长按二维码，选择“识别图中二维码”）,否则功能无法实现哦');});
    });
    wx.ready(function(){
        wx.onMenuShareTimeline({
            title: 'welcome to my homepage', // 分享标题
            link: 'http://www.polarsky.cc', // 分享链接
            imgUrl: 'http://www.polarsky.cc/favicon.ico', // 分享图标
            success: function () {
                alert("感谢你的支持！");
                // 用户确认分享后执行的回调函数
            },
            cancel: function () {
                // 用户取消分享后执行的回调函数
            },
            fail: function(msg){
                alert(msg);
            }
        });/*
        wx.onMenuShareAppMessage({
            title: '［百姓网/测试］看看你的嘴有多利索', // 分享标题
            desc: '5秒钟内你能说多少次“百姓网”？', // 分享描述
            link: 'http://www.polarsky.cc/jump.html', // 分享链接
            imgUrl: 'http://www.polarsky.cc/favicon.ico', // 分享图标
            type: 'link', // 分享类型,music、video或link，不填默认为link
            success: function () {
                // 用户确认分享后执行的回调函数
                alert("感谢你的支持！");
            },
            cancel: function () {
                // 用户取消分享后执行的回调函数
            }
        });*/
        wx.onMenuShareAppMessage({
            title: 'ttttt', // 分享标题
            desc: 'ddddd', // 分享描述
            link: 'http://www.polarsky.cc', // 分享链接
            imgUrl: 'http://www.polarsky.cc/favicon.ico', // 分享图标
            type: 'link', // 分享类型,music、video或link，不填默认为link
            dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
            success: function () {
                // 用户确认分享后执行的回调函数
                alert('hi');
            },
            cancel: function () {
                // 用户取消分享后执行的回调函数
            }
        });
        wx.onVoiceRecordEnd({
            complete: function (res) {
                localVoiceList.push(res.localId);
            }
        })
        wx.checkJsApi({
            jsApiList: ['downloadVoice'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
            success: function(res) {
                // 以键值对的形式返回，可用的api值true，不可用为false
                // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
                alert(res.checkResult.downloadVoice);
            }
        });
    });
    wx.config({
        'debug': 1, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        'appId': 'wx26c652b1b427bcfd', // 必填，公众号的唯一标识
        'timestamp': timestamp, // 必填，生成签名的时间戳
        'nonceStr': nonceStr, // 必填，生成签名的随机串
        'signature': signature,// 必填，签名，见附录1
        'jsApiList': ['downloadVoice','uploadVoice','stopVoice','onVoiceRecordEnd','startRecord','stopRecord','playVoice','onMenuShareAppMessage','onMenuShareTimeline',
            'pauseVoice','chooseImage','previewImage','uploadImage','downloadImage', 'getLocation',
            'openLocation', 'scanQRCode', 'startRecord', 'stopRecord', 'translateVoice', 'playVoice'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
    });
});
function uploadImg(event)
{
    wx.chooseImage({
        count: 9, // 默认9
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: function (res) {
            localImageList = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
            function up(i) {
                if(i>=localImageList.length)
                {
                    if(i==0)
                    {
                        alert("no picture chosen");
                    }
                    else
                    {
                        alert("all picture uploaded, consumed "+((new Date()).getTime()-timestart)+'s');
                    }
                    return;
                }
                wx.uploadImage({
                    localId: localImageList[i], // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 0, // 默认为1，显示进度提示
                    success: function (res) {
                        var serverId = res.serverId; // 返回图片的服务器端ID
                        serverImageList.push(serverId);
                        $.post("upload",
                            serverId,
                            function (data, status) {
                            });
                        up(i+1);
                    }
                });
            }
            var timestart=(new Date()).getTime();
            up(0);
        }
    });
}

$('#downloadImage').click(function ()
{
    function download(i) {
        if(i>=serverImageList.length)
        {
            if(i==0)
            {
                alert("no img uploaded, upload some imgs first");
            }
            else
            {
                alert("all img downloaded "+((new Date()).getTime()-timestart)+'s');
            }
            return;
        }
        wx.downloadImage({
            serverId: serverImageList[i],
            success: function (res) {
                $("body").prepend("<div class='container'><img src='"+res.localId+"' ></div>");
                download(i+1);
            }
        });
    }
    var timestart=(new Date()).getTime();
    download(0);
});

$('#previewImage').click(function(){
    wx.previewImage({
        current: 'http://img5.douban.com/view/photo/photo/public/p1353993776.jpg',
        urls: [
            'http://img3.douban.com/view/photo/photo/public/p2152117150.jpg',
            'http://img5.douban.com/view/photo/photo/public/p1353993776.jpg',
            'http://img3.douban.com/view/photo/photo/public/p2152134700.jpg'
        ]
    });
});

$('#recordVoice').click(function(){
    wx.startRecord();
});

$('#stopRecord').click(function(){
    wx.stopRecord({
        success: function (res) {
            localVoiceList.push(res.localId);
        }
    });
});

$('#playVoice').click(function(){
        wx.playVoice({
            localId: localVoiceList[localVoiceList.length-1] // 需要播放的音频的本地ID，由stopRecord接口获得
        });
});

$('#pauseVoice').click(function(){
        wx.pauseVoice({
            localId: localVoiceList[localVoiceList.length-1] // 需要播放的音频的本地ID，由stopRecord接口获得
        });
});

$('#stopVoice').click(function(){
        wx.stopVoice({
            localId: localVoiceList[localVoiceList.length-1] // 需要播放的音频的本地ID，由stopRecord接口获得
        });
});

$('#uploadVoice').click(function(){
    function uploadVoice(i) {
        if(i>=localVoiceList.length)
        {
            if(i==0)
            {
                alert("no voice recorded");
            }
            else
            {
                alert("all voices uploaded, consumed "+((new Date()).getTime()-timestart)+'s');
            }
            return;
        }
        wx.uploadVoice({
            localId: localVoiceList[i], // 需要上传的图片的本地ID，由chooseImage接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function (res) {
                var serverId = res.serverId; // 返回图片的服务器端ID
                serverVoiceList.push(serverId);
                uploadVoice(i+1);
            }
        });
    }
    var timestart=(new Date()).getTime();
    uploadVoice(0);
});

$('#downloadVoice').click(function ()
{
    function downloadVoice1(i) {
        if(i>=serverVoiceList.length)
        {
            if(i==0)
            {
                alert("no voice uploaded, upload some imgs first");
            }
            else
            {
                alert("all voices downloaded "+((new Date()).getTime()-timestart)+'s');
            }
            return;
        }
        wx.downloadVoice({
            serverId: serverVoiceList[i], // 需要下载的音频的服务器端ID，由uploadVoice接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function (res) {
                downloadVoice1(i+1); // 返回音频的本地ID
            }
        });
    }
    var timestart=(new Date()).getTime();
    downloadVoice1(0);
});

$('#getlocation').click(function()
{
    wx.getLocation({
        type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
        success: function (res) {
            for(var i in res)
            {
                alert(i+' '+res[i]);
            }
            var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
            var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
            var speed = res.speed; // 速度，以米/每秒计
            var accuracy = res.accuracy; // 位置精度
            alert("your position is:\nlatitude: "+latitude+"\n longtitude: "+longitude+"\n\
                speed: "+speed+"m/s\naccuracy: "+accuracy+"m");
        }
    });
});
$('#showmeonmap').click(function(){
    wx.getLocation({
        type: 'gcj02', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
        success: function (res) {
            alert('changed');
            wx.openLocation({
                latitude: res.latitude, // 纬度，浮点数，范围为90 ~ -90
                longitude: res.longitude, // 经度，浮点数，范围为180 ~ -180。
                name: 'mfe', // 位置名
                address: 'i am here', // 地址详情说明
                infoUrl: 'http://www.polarsky.cc/' // 在查看位置界面底部显示的超链接,可点击跳转
            });
        }
    });
});
$('#scanqrcode').click(function(){
    wx.scanQRCode({
        needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
        scanType: ["qrCode","barCode"], // 可以指定扫二维码还是一维码，默认二者都有
        success: function (res) {
            alert(res.resultStr); // 当needResult 为 1 时，扫码返回的结果
        }
    });
});
$('#tingting').click(function(){
    if(!GtimeRest) {
        wx.startRecord();
        GtimeRest = 5;
        $('#tingting h1').html('录音还有' + GtimeRest + 's');
        $('#tingting').button('refresh');
        GcountDownRecordInterval = setInterval("countDownRecord()", 1000);
        setTimeout('GtimeRest=false;clearInterval(GcountDownRecordInterval);uploadvoice();', 5000);
    }
});
function countDownRecord(){
    $('#tingting h1').html('录音还有'+(GtimeRest-=1)+'s');
    $('#tingting').button('refresh');
}
/*
$('#showattached').click(function(){
    if (sw==0)
    {
        $('#showattached').html("<h1>隐藏附加功能</h1>");
        sw=1;
    }
    else
    {
        $('#showattached').html("<h1>显示附加功能</h1>");
        sw=0;
    }
    $('.attached').slideToggle('slow');
});
*/
$('#abundon').click(function(){
    $('.scoreboard').fadeOut();
});

$('.showranking').click(showranking);

function showranking(){
    $.get("ranking",
        {},
        function(data, status){
            $('#rankinglist').html('');
            $('#rankinglist').append(
                '<li data-role="list-divider"><div><p style="display:inline-block; width:40%">nickname</p>' +
                '<p style="display:inline-block; width:40%">score</p></div><span style="display: inline-block; width: 40px;"> </span></li>');
            var rank=JSON.parse(data);
            for(var i=0;i<rank.length;++i)
            {
                var icon='data-icon="delete"';
                if(rank[i]['voiceid']!=undefined)
                {
                    icon='data-icon="check"';
                }
                var voiceId=rank[i]['voiceid'];
                if(rank[i]['voiceid']==undefined)
                {
                    voiceId='none'
                }
                $('#rankinglist').append('<li '+icon+' class="row">\
                            <a href="#"><p style="display:inline-block; width:50%">'+rank[i]['nickname']+'</p>\
                            <p style="display:inline-block; width:50%">'+rank[i]['score']+'</p></a>\
                            <a class="ui-grid-c" onclick="'+
                    'listenOthers(\''+voiceId+'\')'
                +'"> i</a></li>');
            }
            $('#jumptorankingboard').click();
            setTimeout("$('#rankinglist').listview('refresh');",0);
        });
}

function listenOthers()
{
    if(arguments[0]!='none')
    {
        alert(arguments[0]);
        var serverId=arguments[0];
        wx.downloadVoice({
            serverId: serverId, // 需要下载的音频的服务器端ID，由uploadVoice接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function (res) {
                wx.playVoice({
                    localId: res.localId // 需要播放的音频的本地ID，由stopRecord接口获得
                });
            }
        });
    }
    else
    {
        alert('这个人没有上传音频');
    }
}

function countTimes(str, tar)
{
    var count=0;
    var last=0;
    while(str.indexOf(tar, last)!=-1)
    {
        last=str.indexOf(tar, last)+tar.length;
        count++;
    }
    return count;
}
function uploadvoice()
{
    //clearInterval(countdown);
    $('#tingting h1').html('点我开始说话');
    $('#tingting').button('refresh');
    var startTime=(new Date()).getTime();
    wx.stopRecord({
        success: function (res) {
            //alert(res.localId);/*
            challengeId=res.localId;
            wx.translateVoice({
                localId: res.localId, // 需要识别的音频的本地Id，由录音相关接口获得
                isShowProgressTips: 1, // 默认为1，显示进度提示
                success: function (res1) {
                    alert(res1.translateResult); // 语音识别的结果
                    alert((new Date()).getTime()-startTime);
                    showScore(countTimes(res1.translateResult, "百姓网"));
                },
                fail: function(res1){
                    alert(res.errMsg);
                },
                cancel: function(){
                    alert("你取消了识别");
                }
            });
        }
    });
}

function showScore(count)
{
    g_count=count;
    $.get("ranking?wgateid="+getParameter('wgateid'),
        {},
        function(data, status){
            var rank=JSON.parse(data);
            var total=rank.length;
            var number=1;
            while(parseInt(rank[number-1]['score'])>count)
            {
                number++;
                if(number==total-1) break;
            }
            //alert('i am here now');

            $('#noticeforscore').html("恭喜你，<b>"+rank[rank.length-1]+"</b>！你在5秒时间内共说出<b>"+count+"</b>次“百姓网”，在"+total+"人中排名第<b>"+number+"</b>。");
            $('#countdowntoranking').html("5s后跳转到排行榜");
            Gtimerest=5;
            countdowntoranking=setInterval("restTimeBeforeJump()", 1000);
            setTimeout("clearInterval(countdowntoranking);savescore();GtimeRest=false;",5000);
            $('#jumptoscoreboard').click();
        });
}
function restTimeBeforeJump(){
    $('#countdowntoranking').html((Gtimerest-=1)+'s后跳转到排行榜');
}

function savescore(){
    if($('#will-save-voice').attr('checked'))
    {
        wx.uploadVoice({
            localId: challengeId, // 需要上传的图片的本地ID，由chooseImage接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function (res) {
                var serverId = res.serverId; // 返回图片的服务器端ID
                $.post("score",
                    {
                        'score': g_count,
                        'wgateid': getParameter('wgateid'),
                        'voiceid': serverId
                    },
                    function (data, status) {
                        showranking();
                    });
            }
        });
    }
    else {
        $.post("score",
            {
                'score': g_count,
                'wgateid': getParameter('wgateid')
            },
            function (data, status) {
                showranking();
            });
    }
}

function getParameter(name)
{
    if(location.search.indexOf(name)==-1){
        return null;
    }
    return location.search.slice(location.search.indexOf(name)+name.length+1,
        location.search.indexOf('&', location.search.indexOf(name))==-1?location.search.length:location.search.indexOf(
            '&', location.search.indexOf(name)));
}