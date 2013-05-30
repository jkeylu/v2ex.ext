
/**
 * Copyright (c) 2013 jKey Lu <jkeylu@gmail.com>
 * MIT Licensed
 */

function NewTopicExt() {
  this.$topicFormCell = null;
  this.init();
}

NewTopicExt.prototype.init = function () {
  var self = this;

  self.$topicFormCell = $('#Main>div.box>div.cell');
  self.addWBSGHTCButton();
};

NewTopicExt.prototype.addWBSGHTCButton = function () {
  var self = this,
      $btn = $('<a href="#">微博是个好图床</a>');

  $btn.click(function () {
    if ($('#weibotuchuang').length == 0) {
      $tuchuang = $('<div class="cell" id="weibotuchuang"><iframe src="http://weibotuchuang.sinaapp.com" style="height:200px;width:100%;border:none;"></iframe></div>');
      self.$topicFormCell.after($tuchuang);
    }

    return false;
  });

  $('form input[type="submit"]', self.$topicFormCell).after('&nbsp;&nbsp;', $btn);
};

new NewTopicExt();
