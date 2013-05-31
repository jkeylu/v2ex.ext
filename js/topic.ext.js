
/**
 * Copyright (c) 2013 jKey Lu <jkeylu@gmail.com>
 * MIT Licensed
 */

function TopicExt() {
  this.topic = {};

  this.replies = [];
  this.repliesByUsername = {};
  this.repliesByReplyId = {};

  this.topicBox = null;
  this.repliesBox = null;
  this.newReplyBox = null;

  this.fixReplyId = null;

  this.usernames = [];

  this.init();
}

/**
 * 初始化
 */
TopicExt.prototype.init = function () {
  var self = this,
      $boxes = $('#Main>div.box');

  self.topicBox = $boxes[0];
  self.repliesBox = $boxes[1];
  self.newReplyBox = $boxes[2];

  var $topicHeader = $('div.header', self.topicBox);
  self.topic.title = $('h1', self.$topicHeader).text();
  self.topic.by = $('small>a', self.$topicHeader).text();

  self.addMoreTopicButton();

  $('> div', self.repliesBox).each(function (i, row) {
    if (i == 0) return; // 第一行是回复数和最后回复时间

    var $row = $(row),
        reply = self.decomposeReply($row);

    if (!reply.username) return; // 最后一条是翻页

    self.replies.push(reply);
    if (!self.repliesByUsername[reply.username]) {
      self.usernames.push(reply.username);
      self.repliesByUsername[reply.username] = [];
    }
    self.repliesByUsername[reply.username].push(reply);
    self.repliesByReplyId[reply.replyId] = reply;
  });

  if (self.usernames.indexOf(self.topic.by) == -1) {
    self.usernames.push(self.topic.by);
  }

  if (self.newReplyBox) {
    self.extendReplyTextarea();
    self.addWBSGHTCButton();
  }
};

TopicExt.prototype.extendReplyTextarea = function () {
  var self = this;
  $('textarea#reply_content').atwho({
    at: '@',
    data: self.usernames
  });
};


/**
 * 添加 “只看楼主” 和 “显示全部” 按钮
 */
TopicExt.prototype.addMoreTopicButton = function () {
  var self = this,
      $topicButtons = $('div.topic_buttons', self.topicBox),
      $watchOwnerButton = $('<a href="#" class="tb">只看楼主</a>'),
      $showAllButton = $('<a href="#" class="tb">显示全部</a>');

  $watchOwnerButton.click(function () {
    $.each(self.replies, function (i, reply) {
      reply.$row.show();
      if (reply.username == self.topic.by) {
        reply.$foldSign.text('=');
      } else {
        reply.$row.hide();
      }
    });
    return false;
  });

  $showAllButton.click(function () {
    $.each(self.replies, function (i, reply) {
      reply.$foldSign.text('-');
      reply.$row.show();
    });
    return false;
  });

  $topicButtons.append($watchOwnerButton);
  $topicButtons.append($showAllButton);
};


/**
 * 添加 “微博是个好图床” 按钮
 */
TopicExt.prototype.addWBSGHTCButton = function () {
  var self = this,
      $btn = $('<a href="#">微博是个好图床</a>');

  $btn.click(function () {
    if ($('#weibotuchuang').length == 0) {
      $tuchuang = $('<div class="cell" id="weibotuchuang"><iframe src="http://weibotuchuang.sinaapp.com" style="height:200px;width:100%;border:none;"></iframe></div>');
      $('div.inner', self.newReplyBox).before($tuchuang);
    }

    return false;
  });

  $('form', self.newReplyBox).append($btn);
};


/**
 * 解析每条回复
 * @param  {jQuery} $r 每条回复的 jQuery 对象
 * @return {Object}    解析后的回复信息
 */
TopicExt.prototype.decomposeReply = function ($r) {
  var self = this,
      reply = {};

  reply.$row = $r;

  reply.replyId = $r.attr('id');

  var $usernameTag = $('tr>td:last>strong>a', $r);
  reply.username = $usernameTag.text();

  reply.$foldSign = self.createFoldSign(reply.username, reply.replyId);
  var $foldSignWrap = $('<span class="fade small fold_sign_wrap"></span>')
  $foldSignWrap.append('[ ', reply.$foldSign, ' ]');
  $usernameTag.closest('strong').after('&nbsp;&nbsp;', $foldSignWrap);

  reply.$avatar = $('tr>td:first>img.avatar', $r);
  self.addAvatarTip(reply.$avatar, reply.username);

  if (reply.username == self.topic.by) {
    reply.$avatar.css('-webkit-box-shadow', '0 0 10px 5px #06c');
    reply.$avatar.css('box-shadow', '0 0 10px 5px #06c');
  }

  reply.replyTime = $('tr>td:last>span', $r).text();

  reply.$content = $('tr>td:last>div.reply_content', $r);
  self.decomposeReplyContent(reply);

  reply.no = parseInt($('tr>td>div.fr>span.no', $r).text());

  return reply;

};

TopicExt.prototype.decomposeReplyContent = function (currentReply) {
  var self = this;

  function isAtLink($a) {
    var href = $a.attr('href');
    if (/\/member\/(\w+)/i.test(href)) return true;
    else return false;
  }

  $('a', currentReply.$content).click(function () {
    var $a = $(this),
        username, $doc, t, index;
    if (isAtLink($a)) {
      username = $a.text();
      $doc = $(document);
      t = currentReply.$row.offset().top - $doc.scrollTop();
      index = self.replies.indexOf(currentReply);

      currentReply.$foldSign.text('=');
      async.eachSeries(self.replies.slice(0, index).reverse(), function (reply, complete) {
        if (reply.username == username || reply.username == currentReply.username) {
          reply.$foldSign.text('=');
          reply.$row.show({
            duration: 0,
            step: function () {
              var top = currentReply.$row.offset().top - t;
              $doc.scrollTop(top);
            },
            complete: complete
          });
          complete();
        } else {
          reply.$row.hide({
            duration: 0,
            step: function () {
              var top = currentReply.$row.offset().top - t;
              $doc.scrollTop(top);
            },
            complete: complete
          });
        }
      }, function (err) {});

      async.each(self.replies.slice(index + 1), function (reply, complete) {
        if (reply.username == username || reply.username == currentReply.username) {
          reply.$foldSign.text('=');
          reply.$row.show();
        } else {
          reply.$row.hide();
        }
        complete();
      }, function (err) {});

      return false;
    }
  }).on({
    powerTipPreRender: function () {
      var $a = $(this),
          username, replies, $content;
      if (isAtLink($a)) {
        username = $a.text();
        if (username in self.repliesByUsername) {

          replies = self.repliesByUsername[username];
          for (var i = replies.length - 1; i >= 0; i--) {
            if (replies[i].no < currentReply.no) {
              $content = replies[i].$content;
              break;
            }
          }

          if ($content) {
            $(this).data('powertip', $content.clone().contents());
          }

        }
      }
    }

  }).hover(function () {
    if (isAtLink($(this))) {
      $.powerTip.show(this);
    }
  }, function () {
    if (isAtLink($(this))) {
      $.powerTip.hide(this, true);
    }
  }).powerTip({
    placement: 'ne',
    smartPlacement: true,
    fadeInTime: 10,
    fadeOutTime: 10,
    manual: true
  });
};


/**
 * 添加鼠标悬浮在头像上显示用户信息
 * @param  {jQuery} $avatar 用户头像
 * @param  {String} username 用户名
 */
TopicExt.prototype.addAvatarTip = function ($avatar, username) {
  $avatar.on({
    powerTipPreRender: function () {
      if (!$avatar.data('powertip')) {
        utils.getUserByUsername(username, function (err, data) {
          if (err) return;

          var html = utils.avatarTipTpl.render(data);

          // 设置为手动显示 tip
          $avatar.powerTip({
            mouseOnToPopup: true,
            placement: 'w',
            smartPlacement: true,
            manual: true
          });

          $avatar.data('powertip', html);
          $.powerTip.show($avatar);

          // 重新设为自动显示 tip
          $avatar.powerTip({
            mouseOnToPopup: true,
            placement: 'w',
            smartPlacement: true,
            manual: false
          });

        });
      }

    }
  }).powerTip({
    mouseOnToPopup: true,
    placement: 'w',
    smartPlacement: true
  });
};


/**
 * 创建“减号”用于折叠，显示某个用户所有的回复
 * @param  {String} username 用户名
 * @param  {String} replyId 回复的 id
 * @return {jQuery}         "减号"的 jQuery 对象
 */
TopicExt.prototype.createFoldSign = function (username, replyId) {
  var $fold = $('<a class="fold_sign" href="#' + replyId + '">-</a>');
  $fold.click(this.foldSignClicked(username));
  return $fold;
};


/**
 * “减号” 按钮点击事件
 * @param  {String} username 用户账号
 */
TopicExt.prototype.foldSignClicked = function (username) {
  var self = this;

  return function () {
    var $a = $(this),
        $doc = $(document),
        replyId = $a.attr('href').substr(1),
        currentReply = self.repliesByReplyId[replyId],
        t = currentReply.$row.offset().top - $doc.scrollTop(),
        index = self.replies.indexOf(currentReply);

    if ($a.text() == '-') { // 折叠
      $a.text('=');
      async.eachSeries(self.replies.slice(0, index).reverse(), function (reply, complete) {
        if (reply.username == username) {
          reply.$foldSign.text('=');
          complete();
        } else {
          reply.$row.hide({
            duration: 0,
            step: function () {
              var top = currentReply.$row.offset().top - t;
              $doc.scrollTop(top);
            },
            complete: complete
          });
        }
      }, function (err) {});

      async.each(self.replies.slice(index + 1), function (reply, complete) {
        if (reply.username == username) {
          reply.$foldSign.text('=');
        } else {
          reply.$row.hide();
        }
        complete();
      }, function (err) {});

    } else { // 展开
      $a.text('-');

      async.eachSeries(self.replies.slice(0, index).reverse(), function (reply, complete) {
        if (reply.username == username) {
          reply.$foldSign.text('-');
          complete();
        } else {
          reply.$row.show({
            duration: 0,
            step: function () {
              var top = currentReply.$row.offset().top - t;
              $doc.scrollTop(top);
            },
            complete: complete
          });
        }
      }, function (err) {});

      async.each(self.replies.slice(index + 1), function (reply, complete) {
        if (reply.username == username) {
          reply.$foldSign.text('-');
        } else {
          reply.$row.show();
        }
        complete();
      }, function (err) {});

    }

    return false;
  };
};

new TopicExt();
