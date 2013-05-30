
/**
 * Copyright (c) 2013 jKey Lu <jkeylu@gmail.com>
 * MIT Licensed
 */

(function (root) {
  var user_info_by_username = {},
      user_info_by_id = {};

  root.utils = {
    avatarTipTpl: null,

    getUserByUsername: function (username, callback) {
      if (username in user_info_by_username) {
        return callback(null, user_info_by_username[username]);
      }

      $.ajax({
        type: 'GET',
        url: '/api/members/show.json?username=' + username,
        dataType: 'json',
        context: this,
        success: function (data) {
          user_info_by_username[username] = data;
          callback(null, data);
        },
        error: function () {
          callback(true);
        }
      });
    },
    getUserById: function (id, callback) {
      if (id in user_info_by_id) {
        return callback(null, user_info_by_id[id]);
      }

      $.ajax({
        type: 'GET',
        url: '/api/members/show.json?id=' + id,
        dataType: 'json',
        context: this,
        success: function (data) {
          user_info_by_id[id] = data;
          callback(null, data);
        },
        error: function () {
          callback(true);
        }
      });
    }
  };

  function datetimeFormater(timestamp) {
    return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
  }
  function urlChecker(url) {
    if (url) {
      if (url.substr(0, 4) != 'http') {
        url = 'http://' + url;
      }
    }
    return url;
  }
  juicer.register('datetimeFormater', datetimeFormater);
  juicer.register('urlChecker', urlChecker);

  var avatar_tip_url = chrome.runtime.getURL('template/avatar_tip.tpl');
  $.get(avatar_tip_url, function (tpl) {
    utils.avatarTipTpl = juicer(tpl);
  });

})(this);
