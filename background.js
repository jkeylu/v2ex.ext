var notificationId = "checkMessage";

var to = "https://v2ex.com/notifications"; 
chrome.notifications.onClicked.addListener(function(id) {
    if(id === notificationId) {
        console.log(id);
        chrome.tabs.create({
            "url": to 
        }, function() {})

    }
});
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.hasOwnProperty("new-msg")) {
            var msg = request["new-msg"];
            to = msg.to;
            chrome.notifications.create(notificationId, {
                type: "basic",
                title: "温馨提示",
                iconUrl: 'v2ex.ico',
                message: msg.content,
            }, 
            function(id) {
                setTimeout(function() {
                    //https://developer.chrome.com/extensions/notifications#method-clear
                    //The callback is required before Chrome 42.
                    chrome.notifications.clear(id, function(wasCleared) {
                    });
                }, 8000);
            });
        } 
    }
);
