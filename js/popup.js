$(function(){

	var options_url = chrome.extension.getURL('option/options.html');
	//click to open option page
	$("#options").click( function () {
		event.preventDefault();
		chrome.tabs.create({url:options_url}); 
	});

	var url_hot='https://www.v2ex.com/api/topics/hot.json';
	$.ajax({
		url:url_hot,
		dataType: "json",
		success: function(data){
			var test = eval(data);
			var html_str = '';
			for(var i = 1; i < test.length; i ++){
				var title = test[i].title;
				var link = test[i].url;
				var replies = test[i].replies;
				var	avatar_img = "https:" + test[i].member.avatar_mini;
				var avatar = "<img class='avatar' style='background-image:url("+ avatar_img +")'/>";
				html_str += '<li>'+ avatar +
					'<a href="'+link+'" title="'+ title+'" class="v2ex_url" value="'+link+'">'
				    + title + '<span style="color:#BDBDBD;margin-left:3px;">['+replies+'回复]</span></a></li>';
			}
			setTimeout(function () { 
				$("#load_1").css("display", "none");
				$(".hot").append(html_str);
			}, 1000);
		},
		error: function(responseData, textStatus, errorThrown) {
			$("body").append('<span>ajax错误</span>');
		}
	});

	var url_latest='https://www.v2ex.com/api/topics/latest.json';
	$.ajax({
		url:url_latest,
		dataType: "json",
		success: function(data){
			var test = eval(data);
			var html_str = '';
			for(var i = 1; i < test.length; i ++){
				var title = test[i].title;
				var link = test[i].url;
				var replies = test[i].replies;
				var	avatar_img = "https:" + test[i].member.avatar_mini;
				var avatar = "<img class='avatar' style='background-image:url("+ avatar_img +")'/>";
				html_str += '<li>'+avatar+'<a href="'+link+'" title="'+title+'" target="_blank">'+title+'</a></li>';
			}
			setTimeout(function () { 
				$("#load_2").css("display", "none");
				$(".latest").append(html_str);
			}, 1000);
		},
		error: function(responseData, textStatus, errorThrown) {
			$("body").append('<span>ajax错误</span>');
		}
	});

});