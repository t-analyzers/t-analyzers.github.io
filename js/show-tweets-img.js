var DATA_FOLDER_PATH = "data/";
var FILELIST_NAME = "filelist-tweets.json";
var ANNOTATION_LABEL_ELEMENTS = {"illust":"イラスト", "photo":"写真", "text":"文字", "calendar":"カレンダー", "cover":"カバー","placard":"プラカード", "manga":"漫画","capture":"キャプチャ","icon":"アイコン","craft":"ペーパークラフト"};

$(document).ready(function(){
    var filelist_path = DATA_FOLDER_PATH + FILELIST_NAME;

    $.getJSON(filelist_path , function(data) {

	var q = get_url_queries();
	var file_name = "";

	if(q["d"] == undefined){
	    file_name = data[0];
	}else{
	    file_name = "tweets_"+q["d"]+".json";
	}

	var file_path = DATA_FOLDER_PATH + file_name;
	show_tweets_img(file_path);

	//日付のselectプルダウンを作成する
	var html_select = $("#select-date").html();
	var max = (data.length<7) ? data.length : 7 ; //最大7日

	for(var i=0; i<max; i++){
	    var str_date = data[i].replace(/tweets_/g, "").replace(/.json/g, "");
	    html_select += "<option value='"+str_date+"'>"+str_date+"</option>";
	    $("#select-date"+i).attr("value",str_date);
	    $("#select-date"+i).text(str_date);
	}
	$("#select-date").html(html_select);
	$("#select-date").material_select();

	//プルダウンで選択した日付の情報を表示する
	$('.select-wrapper>ul>li>span').on('click',function(elem){
	    var date = elem.target.innerText;
	    file_name = "tweets_"+ date +".json";
	    var file_path = DATA_FOLDER_PATH + file_name;

	    show_tweets_img(file_path);
	});

    });
});

function show_tweets_img(file_path){
    $("#imglist").html("");
    $("#loading").show();

    $.getJSON(file_path , function(tweets) {

	var cards = [];
	for(var i = 0; i < tweets.length; i++){
	    var isIcon = false;
/*	    if(tweets[i].hash_match != undefined){
		if(tweets[i].hash_match.indexOf("icon") != -1){
		    isIcon = true;
		}
		}*/
	    if(tweets[i].hash_match != undefined && tweets[i].hash_match.indexOf("icon") != -1){
		isIcon = true;
	    }
	    
	    if(tweets[i].media_urls != undefined && tweets[i].retweet == undefined && isIcon == false){ //retweetは除く
		var html_card = "";
		var card_title = tweets[i]["user.screen_name"];
		var pid = tweets[i]["PrintID"];
		var labels = tweets[i]["labels"]

		//col用とcard用のdiv start
		html_card = "<div class='col s12 m6 l4'><div class='card'>";

		//card-imageのタグ作成
		html_card += "<div class='card-image'>";
		html_card += "<img  src='" + tweets[i]["media_urls"] + "'>";
		html_card += "</div>";

		//card-contentのタグ作成
		html_card += "<div class='card-content'>";
		html_card += "<span class='card-title activator grey-text text-darken-4'>"
		    + "<i class='material-icons right'>textsms</i></span>";
		html_card += "<p>リツイート数:"+ tweets[i]["retweet_count"] + "</p>";
		if(pid != "" && pid != undefined){ //昔のデータは"PrintID"を含んでいたので1つ目の条件を残す
		    html_card += "<p>プリント予約番号：" + pid + "</p>";
		}
		var tweet_link = "https://twitter.com/"+tweets[i]["user.screen_name"]+"/status/"+tweets[i]["id"];
		html_card += "<p><a href='"+tweet_link+"' target='tweet'><i class='material-icons'>link</i></a></p>";
		html_card += "</div>";

		//card-revealのタグ作成
		html_card += "<div class='card-reveal'>";
		html_card += "<span class='card-title grey-text text-darken-4'>" 
		    + card_title 
		    + "<i class='material-icons right'>close</i></span>";
		html_card += "<p>" + tweets[i]["text"] +"</p>";
		if(labels != "" && labels != undefined){
			html_labels = "";
			for(var j = 0; j < labels.length; j++){
				html_labels +="<div class='chip'>" + ANNOTATION_LABEL_ELEMENTS[labels[j]] + "</div>";
			}
			html_card += html_labels;
		}
		html_card += "</div>";

		//col用とcard用のdiv end
		html_card += "</div></div>";
		
		var card_array = {"card": html_card, "retweet_count": tweets[i]["retweet_count"] };
		cards.push(card_array);
	    }
	}

	$('#img-count').html('件数: ' + cards.length);

	//リツイート数の降順に並び替え
	cards.sort(function(a, b) {
            return (a.retweet_count > b.retweet_count) ? -1 : 1;
	});

	var html_cards = "";
	for(var i = 0; i < cards.length; i++){
	    html_cards += cards[i]["card"];
	}

	$("#imglist").html(html_cards);

	$("#loading").hide();
    });

}

/**
 * URL解析して、クエリ文字列を返す
 * @returns {連想配列} クエリ文字列
 * 参考：　http://qiita.com/ma_me/items/03aaebb5dc440b380244
 */
function get_url_queries()
{
    var queries = {}, max = 0, hash = "", array = "";
    var url = window.location.search;

    //?を取り除くため、1から始める。複数のクエリ文字列に対応するため、&で区切る
    hash  = url.slice(1).split('&');    
    for (var i = 0; i < hash.length; i++) {
        array = hash[i].split('=');    //keyと値に分割。
        queries[array[0]]=array[1];
    }

    return queries;
}
