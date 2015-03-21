(function() {

    var hostURL = window.location.protocol + "//" + window.location.hostname;
    var currentURL = window.location.toString();
    if (currentURL.indexOf("v2ex.com/notifications") > -1) {
        //用每次访问notifications时都更新lastCheck的值
        var ts = new Date().getTime();
        localStorage.setItem("lastCheck", ts);
    }

    function getInterval(callback) {
        chrome.storage.sync.get({
          checkInterval: 10
        }, function(items) {
            callback(1000 * 60 * items.checkInterval);
        });
    }

    function countNewMessage(feedTag) {
        var count = 0;
        var entries = feedTag.children('entry');
        for (var i = 0; i < entries.length; i++) {
            var updateDate = $(entries[i]).children("updated").text();
            var updateTimestamp = new Date(updateDate).getTime();
            var lastCheckTime = parseInt(localStorage.getItem("lastCheck"));
            if (lastCheckTime < updateTimestamp) {
                count ++;
            } else {
                break;
            }
        }
        return count;
    }

    function checkNewMessage(feed, callback) {
        $.ajax({
            url: feed,
            dataType: "xml",
            success: function(xml) {
                var feedTag = $(xml).children('feed');
                var updateDate = feedTag.children('updated').text();
                var updateTimestamp = new Date(updateDate).getTime();
                var lastCheckTime = localStorage.getItem("lastCheck");
                if (lastCheckTime) {
                    lastCheckTime = parseInt(lastCheckTime);
                    if (lastCheckTime < updateTimestamp) {
                        var count = countNewMessage(feedTag);
                        var msg = {
                            to: hostURL + "/notifications",
                            content: "您有" + count + "条新消息"
                        }
                        chrome.runtime.sendMessage({"new-msg": msg});
                    }
                } else {
                    //用当前日期初始化
                    var ts = new Date().getTime();
                    localStorage.setItem("lastCheck", ts);
                }
                
            }
        });   
    }

    function getNotification() {
        var feed = docCookies.getItem("v2ex.ext.feed");
        if (feed) {
            checkNewMessage(feed);   
        } else {
            $.ajax({
                url: hostURL + "/notifications", 
                dataType: "html",
                success: function(html) {
                    var feedInput = $("input.sll", html);
                    if (feedInput && feedInput.length && feedInput.length > 0) {
                        feed = feedInput[0].value;
                        feed = feed.replace("http://www.v2ex.com", hostURL);
                        docCookies.setItem("v2ex.ext.feed", feed);
                        checkNewMessage(feed);
                    } else {
                        var msg = {
                            to: hostURL + "/signin",
                            content: "您还没有登录呢"
                        }
                        chrome.runtime.sendMessage({"new-msg": msg});
                    }
                    
                }
            });    
        }
        getInterval(function(interval) {
            setTimeout(getNotification, interval);
        });
    }
    function init() {
        var flag = docCookies.getItem("v2ex.ext.isStarted") || false;
        flag = JSON.parse(flag);
        if (! flag ) {
            docCookies.setItem("v2ex.ext.isStarted", true);
            getNotification();
        };
    }
    init();

})();
