function onMessage(message, sender, sendResponse) {
  if (message && message.name == 'frequencyChanged') {
    console.log('onMessage: frequencyChanged');
    onInit();
  }
}
chrome.runtime.onMessage.addListener(onMessage);

function onClicked(notificationId) {
  if (notificationId == 'checkMessage') {
    chrome.tabs.create({ url: 'https://v2ex.com/notifications' }, function() {});
  }
}
chrome.notifications.onClicked.addListener(onClicked);

function startRequest() {
  getNewMessageCount(function(count) {
    console.log('new message count: ' + count);
    if (count <= 0) {
      return;
    }
    var options = {
      type: "basic",
      title: "温馨提示",
      iconUrl: 'v2ex.ico',
      message: '您有 ' + count + ' 条未读提醒'
    };
    chrome.notifications.create('checkMessage', options, function(id) {
      setTimeout(function() {
        // https://developer.chrome.com/extensions/notifications#method-clear
        // The callback is required before Chrome 42.
        chrome.notifications.clear(id, function(wasCleared) { });
      }, 8000);
    });
  });
}

function getNewMessageCount(callback) {
  $.ajax({
    method: 'GET',
    url: 'https://www.v2ex.com/',
    dataType: 'html',
    success: function(data) {
      var doc = $(data);

      var unreadStr =
        doc.find('#Rightbar .box:first div a:contains("未读提醒")').html()
        || doc.find('#Rightbar .box:first div a:contains("unread")').html();

      if (unreadStr) {
        console.log(unreadStr);
        var m = unreadStr.match(/(\d+)\s*(unread|条未读提醒)/);
        if (m && m.length == 3) {
          callback(~~m[1]);
        }
      }
    }
  });
}

function onInit() {
  console.log('onInit');
  chrome.alarms.clear('watching', function(wasCleared) {
    chrome.storage.sync.get({ checkInterval: 0 }, function(items) {
      console.log('checkInterval: ' + items.checkInterval);
      var minutes = ~~items.checkInterval;
      if (minutes > 0) {
        startRequest();
        chrome.alarms.create('watching', { periodInMinutes: minutes });
      }
    });
  });
}

function onAlarm(alarm) {
  if (alarm && alarm.name == 'watching') {
    onWatchdog();
  }
}

function onWatchdog() {
  startRequest();
}

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);
