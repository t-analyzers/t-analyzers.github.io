$(document).ready(function(){

    var DATA_FOLDER_PATH = "data/";
    var FILELIST_NAME = "filelist-feature_words.json";
    var filelist_path = DATA_FOLDER_PATH + FILELIST_NAME;

    $.getJSON(filelist_path , function(data) {

	var q = get_url_queries();
	var file_name = "";

	if(q["p"] == undefined){
	    file_name = data[0];
	}else{
	    file_name = "feature_words_"+q["p"]+".json";
	}

	var file_path = DATA_FOLDER_PATH + file_name;
	show_feature_words(file_path);
    });

});

function show_feature_words(file_path){
    $.getJSON(file_path , function(data) {

	var table_contents_html = "";
	var N = data.length
	var graph_data = [['年月日', 'ツイート件数(RT含む)', 'RT件数','ポジ件数','ネガ件数']];

	for(var i = 0; i < N; i++){

	    // HTML
	    str_date = (data[i].date).replace(/\//g, "");
	    table_contents_html += "<tr id='"+ str_date +"'>" + 
		"<td class='wordcloud'>"+ data[i].date + "</td>";

	    var words = data[i].feature_words;
	    for(var j = 0; j < words.length; j++) {
		table_contents_html += "<td class='words'>"+ words[j] + "</td>";
	    }

	    table_contents_html += "<td>" +  
		"<span class='nega'><i class='material-icons'>mood_bad</i></span>" + 
		"<span  class='posi'><i class='material-icons'>mood</i></span>" +
		"</td>";

	    table_contents_html += "</tr>";

	    //グラフ用データ
	    graph_data.push([data[(N-1)-i].date,data[(N-1)-i].tweets_count,data[(N-1)-i].retweets_count,
			     data[(N-1)-i].posi_count,data[(N-1)-i].nega_count]);
	}

	//テーブルデータ表示
	var tableContents = $("#feature_words");
  	tableContents.html(table_contents_html);

	//グラフ描画
	draw_chart(graph_data);

	//クリックイベント
	$('td.words').on('click',function(elem){

	    var date = elem.target.parentNode.id;
	    var word = elem.target.innerText;

	    show_tweets_with_filter(date, word, "");
	});

	//クリックイベント
	$('.posi,.nega').on('click',function(elem){
	    //elemからの取得の仕方がイマイチ。改善したい。
	    var date = elem.target.parentNode.parentNode.parentNode.id;
	    var negaposi = elem.target.parentNode.className;
	    show_tweets_with_filter(date, "", negaposi);
	});

	//クリックイベント
	$('td.wordcloud').on('click',function(elem){

	    var date = elem.target.parentNode.id;
	    show_wordcloud(date);

	});

	//クリックイベント
	$('#wordcloud').on('click',function(){
	    $('#wordcloud').hide();
	});

    });
}

function show_tweets_with_filter(str_date, word, negaposi){

    var tweets_file_path = "data/tweets_" + str_date + ".json";

    $.getJSON(tweets_file_path , function(tweets) {
	$("#tweets-table").show();
	$("#loading").hide();

	var filter_title = "";
	if(word != ""){
	    filter_title = "【特徴語：" + word + "】";
	}else if(negaposi != ""){
	    if(negaposi == "posi"){
		filter_title = "【ポジティブツイート】";
	    }else if(negaposi == "nega"){
		filter_title = "【ネガティブツイート】";
	    }
	}
	$("#filter_title").text(filter_title);

	var table_contents_html = "";
	var N = tweets.length;
	var IMG_WIDTH = $(window).width()/20;
	for(var i = 0; i < N; i++) {
	    var condition = false;

	    //表示条件
	    if(word != ""){ //wordが設定されている場合、textにwordが含まれているかどうかをconditionに設定する
		//tweetの名詞群(text)にwordが含まれている場合に表示する
		condition = ((tweets[i].text).indexOf(word) != -1);
	    }else if(negaposi !=""){ //negaposiが設定されている場合、negaまたはposiでconditionに設定する
		if(negaposi == "posi"){
		    condition = (tweets[i].negaposi == 1)
		}else if(negaposi == "nega"){
		    condition = (tweets[i].negaposi == -1)
		}
	    }

	    //conditionがtrueの場合表示する。
	    if(condition){
		table_contents_html += "<div class='row center'>";
		table_contents_html +="<div class='col s1'>" + tweets[i].created_datetime + "</div>" +
		    "<div class='col s1'>" + tweets[i].retweet_count + "</div>" + 
		    "<div class='col s7'>" + tweets[i].text + "</div>";
		var printid = "";
		var tweet_link = "https://twitter.com/"+tweets[i]["user.screen_name"]+"/status/"+tweets[i]["id"];
		table_contents_html += "<div class='col s1'><a href='"+tweet_link+"' target='tweet'><i class='material-icons'>link</i></a></div>";
		var img_link = "";
		if(tweets[i].media_urls != undefined){
		    img_link = "<img class='materialboxed' width='"+IMG_WIDTH+"' src='" + tweets[i].media_urls + "'>";
		}
		table_contents_html += "<div class='col s1'>" + img_link + "</div>";
		if(tweets[i].PrintID != undefined){
		    printid = tweets[i].PrintID
		}
		table_contents_html += "<div class='col s1'>" + printid + "</div>";
		table_contents_html +="</div>";
	    }
	}

	var tableContents = $("#tweets");
	tableContents.html(table_contents_html);
	$('.materialboxed').materialbox();
    });

    $("#tweets-table").hide();
    $("#loading").show();
    move_in_page("#top");
}

function draw_chart(graph_data){
    // この辺おまじない
    google.charts.load('current', {'packages':['corechart']});

    google.charts.setOnLoadCallback(function(){
	// データ
	var data = google.visualization.arrayToDataTable(graph_data);
	// グラフの描画オプション設定
	var options = {
	    title: '日次ツイート件数',
	    chartArea: {'width':'70%', 'height':'65%', 'left':65 },
	    hAxis: { title:'年月日', titleTextStyle:{italic:false} },
	    vAxis: { title:'件数',  titleTextStyle:{italic:false} },
	    crosshair: { trigger: 'both' }
	};
	// この辺おまじない
	var chart = new google.visualization.LineChart(document.getElementById('chart'));
	chart.draw(data, options);
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

function show_wordcloud(str_date){
    var img_path = "data/wordcloud_" + str_date + ".png";
    $("#wordcloud").show();
    $("#wordcloud_img").attr("src",img_path);
    move_in_page("#wordcloud");
}

/**
   ページ内でアニメーション付き遷移する
   target_id: 移動先のid（セレクタ形式： #XXXX）
*/
function move_in_page(target_id){
    // 移動先のタグ
    var target = $(target_id);
    // 移動先となる値
    var targetY = target.offset().top;

    // スクロールにかかる時間
    var time = 500;

    // スクロールアニメーション
    $('html,body').animate({scrollTop: targetY}, time, 'swing');
}