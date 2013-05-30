
/**
 * Copyright (c) 2013 jKey Lu <jkeylu@gmail.com>
 * MIT Licensed
 */

function SiteExt() {
  this.avatarTipTpl = null;
  this.init();
}

SiteExt.prototype.init = function () {
  var self = this;
  this.addAvatarTip();
};

SiteExt.prototype.addAvatarTip = function () {
  var self = this;
  $('a>img.avatar').on({
    powerTipPreRender: function () {
      var $avatar = $(this),
          matches, src;

      function getUserCallback(err, data) {
        if (err) return;

        var html = utils.avatarTipTpl.render(data);

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
        } else {
          src = $avatar.closest('a').attr('href');
          matches = src.match(/\/member\/(\w+)$/i); // 匹配用户名
          if (matches) {
            utils.getUserByUsername(matches[1], getUserCallback);
          } else {
            return;
          }
        }

      }
    }
  }).powerTip({
    mouseOnToPopup: true,
    placement: 'w',
    smartPlacement: true
  });

};

new SiteExt();
