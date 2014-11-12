/**
 * Copyright (c) 2013 jKey Lu <jkeylu@gmail.com>
 * MIT Licensed
 */

// {{{ each and eachSeries
// Reference: https://github.com/caolan/async

function each(arr, iterator, callback) {
  callback = callback || function () {};
  if (!arr.length) return callback();

  var completed = 0;
  arr.forEach(function (x) {
    iterator(x, function (err) {
      if (err) {
        callback(err);
        callback = function () {};
      } else {
        completed += 1;
        if (completed >= arr.length) callback(null);
      }
    });
  });
}

function eachSeries(arr, iterator, callback) {
  callback = callback || function () {};
  if (!arr.length) return callback();

  var completed = 0;
  var iterate = function () {
    iterator(arr[completed], function (err) {
      if (err) {
        callback(err);
        callback = function () {};
      } else {
        completed += 1;
        if (completed >= arr.length) callback(null);
        else iterate();
      }
    });
  };
  iterate();
}

// }}}

// {{{ utils
var utils = (function () {
  var user_info_by_username = {}
    , user_info_by_id = {};

  return {
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
    },
    formatDate: function (timestamp) {
      try {
        var t = new Date(timestamp * 1000);
        return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate()
          + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds();
      } catch (e) {
        return '';
      }
    },
    checkUrl: function (url) {
      if (url && url.substr(0, 4) != 'http') {
        url = 'http://' + url;
      }
      return url;
    },
    formatTemplate: function (data) {
      var str = '<p>V2EX 第 ' + data.id + ' 号会员</p>'
        + '<p>加入于 ' + utils.formatDate(data.created) + '</p>'
        + '<p>用户名: ' + data.username + '</p>';
      if (data.location && data.location != 'None')
        str += '<p>所在地: ' + data.location + '</p>';
      if (data.tagline && data.tagline != 'None')
        str += '<p>签名: ' + data.tagline + '</p>';
      if (data.website && data.website != 'None')
        str += '<p>个人网站: <a href="' + utils.checkUrl(data.website) + '">'
          + data.website + '</a>';
      return str;
    }
  };
})();
// }}}

// {{{ 微博图床
// Reference: [微博是个好图床](http://weibotuchuang.sinaapp.com/)

var weibotuchuang = (function () {
  var upLoadFlag = true;

  function requestDone(resText, completed) {
    if (!resText) {
      completed('上传失败。');
      return;
    }
    var splitIndex, rs, pid;
    try {
      splitIndex = resText.indexOf('{"');
      rs = JSON.parse(resText.substring(splitIndex));
      pid = rs.data.pics.pic_1.pid;
    } catch (e) {
      completed('上传失败，请登录微博后再试试。');
      return;
    }
    completed(null, pid2url(pid, 'large'));
  }

  var postData = (function () {
    var isSafari = false
      , done;
    try {
      isSafari = !!(safari && safari.self && safari.self.tab);
    } catch (err) {}
    if (isSafari) {
      safari.self.addEventListener('message', function (e) {
        if (e.name === 'v2ex-post-data-to-weibo-done') {
          requestDone(e.message, done);
        }
      }, false);
    }

    if (!isSafari) {
      return function (base64, completed) {
        var xhr = new XMLHttpRequest()
          , data = new FormData();

        data.append('b64_data', base64);
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 )
              requestDone(xhr.responseText, completed);
            else
              completed('图片上传失败');
          }
        };
        xhr.open('POST', 'http://picupload.service.weibo.com/interface/pic_upload.php?&mime=image%2Fjpeg&data=base64&url=0&markpos=1&logo=&nick=0&marks=1&app=miniblog');
        xhr.send(data);
      };
    } else {
      return function (base64, completed) {
        done = completed;
        safari.self.tab.dispatchMessage('v2ex-post-data-to-weibo', base64);
      };
    }
  })();

  function upload (file, completed) {
    if (upLoadFlag === false) {
      completed('正在上传文件');
      return false;
    }
    if (!file) {
      completed('文件不存在,请重试');
      return false;
    }
    if (file && file.type.indexOf('image') === -1) {
      completed('文件不是图片格式,请重试');
      return false;
    }

    upLoadFlag = false;

    var reader = new FileReader();
    reader.onloadend = function(e) {		
      var base64 = e.target.result.split(',')[1];
      postData(base64, function () {
        upLoadFlag = true;
        completed.apply(null, arguments);
      });
    };
    try {
      reader.readAsDataURL(file);
    } catch (e) {
    }
  }

  function pid2url(pid, type) {
    function crc32(str) {
      str = String(str);
      var table = '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';
      if (typeof(crc) == 'undefined') {
        crc = 0;
      }
      var x = 0
        , y = 0;

      crc = crc ^ (-1);
      for (var i = 0, iTop = str.length; i < iTop; i++) {
        y = (crc ^ str.charCodeAt(i)) & 0xFF;
        x = '0x' + table.substr(y * 9, 8);
        crc = (crc >>> 8) ^ x;
      }
      return crc ^ (-1);
    }

    var url, zone, ext;
    if (typeof(type) == 'undefined') type = 'bmiddle';
    if (pid[9] == 'w') {
      zone = (crc32(pid) & 3) + 1;
      ext = (pid[21] == 'g') ? 'gif' : 'jpg';
      url = 'http://ww' + zone + '.sinaimg.cn/' + type + '/' + pid + '.' + ext;
    } else {
      zone = ((pid.substr(-2, 2), 16) & 0xf) + 1;
      url = 'http://ss' + zone + '.sinaimg.cn/' + type + '/' + pid + '&690';
    }
    return url;
  }

  return { upload: upload }
})();
// }}}

// {{{ topic

// {{{ Topicstruct and TopicExt
var FOCUS_ON = '只看'
  , UNDO = '还原';

function TopicStruct() {
  this.topicBox = null;
  this.repliesBox = null;
  this.newReplyBox = null;

  this.topic = {};
  this.replies = [];
  this.repliesByUsername = {};
  this.repliesByReplyId = {};
  this.repliesByNo = {};
}

function TopicExt() {
  this._topicStruct = new TopicStruct();
  this.init();
}
// }}}

// {{{ 初始化
TopicExt.prototype.init = function () {
  var self = this
    , st = this._topicStruct
    , $boxes = $('#Main>div.box');

  st.topicBox = $boxes[0];
  st.repliesBox = $boxes[1];
  st.newReplyBox = $boxes[2];

  var $topicHeader = $(st.topicBox).find('div.header');
  st.topic.title = $topicHeader.find('h1').text();
  st.topic.by = $topicHeader.find('small>a').text();

  this.addMoreTopicButton();

  $(st.repliesBox).find('>div').each(function (i, row) {
    if (i == 0) return; // 第一行是回复数和最后回复时间

    var $row = $(row)
      , reply = self.decomposeReply($row);

    if (!reply.username) return; // 最后一条是翻页

    st.replies.push(reply);
    if (!st.repliesByUsername[reply.username]) {
      st.repliesByUsername[reply.username] = [];
    }
    st.repliesByUsername[reply.username].push(reply);
    st.repliesByReplyId[reply.replyId] = reply;
    st.repliesByNo[reply.no] = reply;
  }).on('click', 'a.ext_foldSign', function () {
    var $fold = $(this)
      , reply = $fold.closest('table').parent().data('reply');
    foldSignClicked($fold, reply.replyId, reply.username, st)
  }).on('click', 'a.at_me', function () {
    var reply = $(this).closest('table').parent().data('reply');
    whoAtMe(reply.replyId, reply.username, st);
    return false;
  }).on('mouseenter', function () {
    var cell = $(this);
    var reply = cell.data('reply');
    if (reply.hasPeopleAtMe == undefined) {
      reply.hasPeopleAtMe = false;
      for (var i = 0, len = st.replies.length; i < len; i++) {
        if (st.replies[i].ats.indexOf(reply.username) >= 0) {
          reply.hasPeopleAtMe = true;
          break;
        }
      }
    }
    if (reply.hasPeopleAtMe === true) {
      cell.find('a.at_me').show();
    }
  }).on('mouseleave', function () {
    $(this).find('a.at_me').hide();
  });
};
// }}}

// {{{ 添加 “只看楼主” 和 “显示全部” 按钮
TopicExt.prototype.addMoreTopicButton = function () {
  var st = this._topicStruct
    , $topicButtons = $('div.topic_buttons', st.topicBox)
    , $watchOwnerButton = $('<a href="#" class="tb">只看楼主</a>')
    , $showAllButton = $('<a href="#" class="tb">显示全部</a>');

  $watchOwnerButton.click(function () {
    $.each(st.replies, function (i, reply) {
      reply.$row.show();
      if (reply.username == st.topic.by) {
        reply.$foldSign.text(UNDO);
      } else {
        reply.$row.hide();
      }
    });
    return false;
  });

  $showAllButton.click(function () {
    $.each(st.replies, function (i, reply) {
      reply.$foldSign.text(FOCUS_ON);
      reply.$row.show();
    });
    return false;
  });

  $topicButtons.append($watchOwnerButton);
  $topicButtons.append($showAllButton);
};
// }}}

// {{{ 解析每条回复
TopicExt.prototype.decomposeReply = function ($r) {
  var reply = {}
    , st = this._topicStruct;
  reply.$row = $r;
  reply.hidden = $r.hasClass('collapsed');
  reply.replyId = $r.attr('id');
  reply.no = parseFloat($r.find('span.no').text());
  //reply.replyTime = $r.find('tr>td:last>span').text();

  var $usernameTag = $r.find('tr>td:last>strong>a');
  reply.username = $usernameTag.text();
  reply.$foldSign = $('<a href="javascript:void(0);" class="ext_foldSign dark">' + FOCUS_ON + '</a>');
  $usernameTag.closest('strong').nextAll('span').last().after('&nbsp;&nbsp;', reply.$foldSign);

  reply.$avatar = $r.find('img.avatar');
  reply.$avatar.data('username', reply.username);
  if (reply.username == st.topic.by) {
    reply.$avatar.addClass('ext_owner');
  }

  reply.$content = $r.find('div.reply_content');
  reply.ats = reply.$content.find('a[href^="/member/"]').map(function () {
    return $(this).text();
  }).get();
  reply.$foldSign.after('&nbsp;&nbsp;<a href="javascript:void(0);" class="at_me dark" style="display: none;">@我</a>');
  this.decomposeReplyContent(reply);

  $r.data('reply', reply);

  return reply;
};
// }}}

// {{{ 解析回复内容
TopicExt.prototype.decomposeReplyContent = function (currentReply) {
  var self = this
    , st = this._topicStruct;

  function isAtLink($a) {
    return /\/member\/(\w+)/i.test($a.attr('href'));
  }

  currentReply.$content.on('click', 'a', function () {
    var $a = $(this)
      , username, $doc, t, index;
    if (isAtLink($a)) {
      username = $a.text();
      $doc = $(document);
      t = currentReply.$row.offset().top - $doc.scrollTop();
      index = st.replies.indexOf(currentReply);

      currentReply.$foldSign.text(UNDO);
      eachSeries(st.replies.slice(0, index).reverse(), function (reply, complete) {
        if (reply.username == username || reply.username == currentReply.username) {
          reply.$foldSign.text(UNDO);
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

      each(st.replies.slice(index + 1), function (reply, complete) {
        if (reply.username == username || reply.username == currentReply.username) {
          reply.$foldSign.text(UNDO);
          reply.$row.show();
        } else {
          reply.$row.hide();
        }
        complete();
      }, function (err) {});

      return false;
    }
  });
  currentReply.$content.find('a').on({
    powerTipPreRender: function () {
      var $a = $(this)
        , username, replies, $content;
      if (isAtLink($a)) {
        username = $a.text();
        if (username in st.repliesByUsername) {

          replies = st.repliesByUsername[username];
          for (var i = replies.length - 1; i >= 0; i--) {
            if (replies[i].no < currentReply.no) {
              $content = replies[i].$content;
              break;
            }
          }

          if ($content)
            $(this).data('powertip', $content.clone().contents());
        }
      }
    }
  }).hover(function () {
    if (isAtLink($(this)))
      $.powerTip.show(this);
  }, function () {
    if (isAtLink($(this)))
      $.powerTip.hide(this, true);
  }).powerTip({
    placement: 'ne',
    smartPlacement: true,
    fadeInTime: 10,
    fadeOutTime: 10,
    manual: true
  });
};
//}}}

// {{{ 折叠和展开

function foldSignClicked($a, replyId, username, st) {
  var $doc = $(document)
    , currentReply = st.repliesByReplyId[replyId]
    , t = currentReply.$row.offset().top - $doc.scrollTop()
    , index = st.replies.indexOf(currentReply);

  function foldSignDoEachSeries(method, replies, text) {
    eachSeries(replies, function (reply, complete) {
      reply.$foldSign.text(text);
      if (reply.username == username) {
        complete();
      } else {
        reply.$row[method]({
          duration: 0,
          step: function () {
            $doc.scrollTop(currentReply.$row.offset().top - t);
          },
          complete: complete
        });
      }
    }, function (err) {});
  }

  function foldSignDoEach(method, replies, text) {
    each(replies, function (reply, complete) {
      setTimeout(function () {
        reply.$foldSign.text(text);
        if (reply.username != username) {
          reply.$row[method]();
        }
      }, 0);
      complete();
    }, function (err) {});
  }

  if ($a.text() == FOCUS_ON) { // 折叠
    $a.text(UNDO);
    foldSignDoEachSeries('hide', st.replies.slice(0, index).reverse(), UNDO);
    foldSignDoEach('hide', st.replies.slice(index + 1), UNDO);
  } else { // 还原
    $a.text(FOCUS_ON);
    foldSignDoEachSeries('show', st.replies.slice(0, index).reverse(), FOCUS_ON);
    foldSignDoEach('show', st.replies.slice(index + 1), FOCUS_ON);
  }
};

function whoAtMe(replyId, username, st) {
  var $doc = $(document)
    , currentReply = st.repliesByReplyId[replyId]
    , t = currentReply.$row.offset().top - $doc.scrollTop()
    , index = st.replies.indexOf(currentReply);

  currentReply.$foldSign.text(UNDO);
  eachSeries(st.replies.slice(0, index).reverse(), function (reply, complete) {
    if (reply.ats.indexOf(username) >= 0 || reply.username == username) {
      reply.$foldSign.text(UNDO);
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

  each(st.replies.slice(index + 1), function (reply, complete) {
    if (reply.ats.indexOf(username) >= 0 || reply.username == username) {
      reply.$foldSign.text(UNDO);
      reply.$row.show();
    } else {
      reply.$row.hide();
    }
    complete();
  }, function (err) {});

}
// }}}

// }}}

$(function () {
  if (!/v2ex.com/i.test(window.location.href))
    return;

  if (/v2ex.com\/t\/.*/i.test(window.location.href)) {
    new TopicExt();
  } else if (/v2ex.com\/new\/.*/i.test(window.location.href)) {
  }

  // {{{ 添加 “微博是个好图床”
  $('textarea').each(function (i, ele) {
    var replyContent = $(this);

    function weibotuchuangUpload(file) {
      weibotuchuang.upload(file, function (err, src) {
        if (err) {
          alert(err);
          console.log(err);
          return;
        }
        var c = replyContent.val();
        c += c ? ('\n' + src) : src;
        replyContent.val(c);
      });
    }

    function ondrop(e) {
      e.preventDefault();
      e.stopPropagation();

      var oe = e.originalEvent;
      file = oe.dataTransfer.files && oe.dataTransfer.files[0];
      weibotuchuangUpload(file);
    }

    function stop(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function handlePaste(e) {
      var oe = e.originalEvent;
      var clipboardData, items, item; //for chrome
      if (oe && (clipboardData = oe.clipboardData)
          && (items = clipboardData.items)) {
        var b = false;
        for (var i = 0, l = items.length; i < l; i++) {
          if((item = items[i])
             && item.kind == 'file'
             && item.type.match(/^image\//i)) {
            b = true;
            weibotuchuangUpload(item.getAsFile());
          }
        }
        if (b) return false;
      }
    }

    replyContent.on('dragover', stop);
    replyContent.on('dragenter', stop);
    replyContent.on('dragleave', stop);
    replyContent.on('drop', ondrop);
    replyContent.on('paste', handlePaste)
  });
// }}}

  // {{{ 鼠标移到头像上时，显示信息
  $('img.avatar').on({
    powerTipPreRender: function () {
      var $avatar = $(this)
        , matches, src;

      function getUserCallback(err, data) {
        if (err) return;

        var html = utils.formatTemplate(data);

        // 手动显示
        $avatar.powerTip({
          mouseOnToPopup: true,
          placement: 'w',
          smartPlacement: true,
          manual: true
        });

        $avatar.data('powertip', html);
        $.powerTip.show($avatar);

        // 自动显示
        $avatar.powerTip({
          mouseOnToPopup: true,
          placement: 'w',
          smartPlacement: true,
          manual: false
        });
      }

      if (!$avatar.data('powertip')) {
        src = $avatar.attr('src');

        matches = src.match(/\/(\d+)_[a-z]+.png/i); // 匹配用户 id
        if (matches) {
          utils.getUserById(matches[1], getUserCallback);
        } else if ($avatar.data('username')) {
          utils.getUserByUsername($avatar.data('username'), getUserCallback);
        } else {
          var $memberLink = $avatar.closest('a');
          if ($memberLink.length > 0) {
            src = $memberLink.attr('href');
            matches = src.match(/\/member\/(\w+)$/i); // 匹配用户名
            if (matches) {
              utils.getUserByUsername(matches[1], getUserCallback);
            }
          }
        }

      }
    }
  }).powerTip({
    mouseOnToPopup: true,
    placement: 'w',
    smartPlacement: true
  });
  // }}}

});
