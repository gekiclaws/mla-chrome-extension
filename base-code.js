
const cheerio = require('cheerio');
const request = require('request');

var citation = document.getElementById('citation');
var inText = document.getElementById('in-text');

// Gets URL of current tab
chrome.tabs.query({
    active: true,
    currentWindow: true
},
function(tabs) {
    var tabURL = tabs[0].url; // Scrapes raw URL
    request({
		method: 'GET', // Scrapes HTML code off website
		    url: tabURL
		}, (err, res, body) => {

		    if (err) return console.error(err);

		    const $ = cheerio.load(body); // Loads HTML code for data scraping

		    var json = 0; // check for ld+json file + parsing if exists
		    if (typeof $('script[type="application/ld+json"]').html() == "string"){
		    	json = $('script[type="application/ld+json"]').first().html().replace('//"', '"');
		    	if (json.indexOf("[") == 0) { json = json.substring(1, json.length-1); }
		    	json = "{"+json.substring(json.lastIndexOf('"@context"'), json.length);
		    }

		    var url = tabURL.replace(/^https?:\/\//,''); // Parses previous URL
		    //
		    var author = ""; // Scrape author
		    var jsonfail = true;

		    if (url.includes("wikipedia")){ // wikipedia
		    	author = "Wikipedia Contributors";
		    } else if (typeof $("p[class='meta post-meta']").html() == "string"){ // kknews.cc
		    	ht = $("p[class='meta post-meta']").html();
		    	author = ht.substring(ht.indexOf("<em>")+4, ht.lastIndexOf("<a")-1)
		    	author = author.substring(author.indexOf("&#xA0")+6, author.lastIndexOf("&#xA0")-1);
	    	} else if (json){ // json method
		    	// console.log(JSON.parse(json).author);
		    	if (typeof JSON.parse(json).author != "undefined"){
		    		if (typeof JSON.parse(json).author.name != "undefined"){
		    			author = JSON.parse(json).author.name;
		    			jsonfail = false;
		    		}
		    	}
		    } 

		    if (jsonfail && typeof $("meta[name='author']").attr("content") == "string"){  // <meta> tag method 1
		    	author = $("meta[name='author']").attr("content"); 
		    } else if (jsonfail && typeof $("meta[property='author']").attr("content") == "string"){ // <meta> tag method 2
		    	author = $("meta[property='author']").attr("content"); 
		    }

		    if (author.indexOf('／') != -1) {author = author.substring(0, author.indexOf('／'));}
		    if (author.indexOf('-') != -1) {author = author.substring(0, author.indexOf(' -'));}
		    //
		    var title = $("title").first().text().trim() // Scrape title
		    if (title.indexOf(' -') != -1) {title = title.substring(0, title.indexOf(' -'));}
		    if (title.indexOf(' –') != -1) {title = title.substring(0, title.indexOf(' –'));} // '-' length difference 
		    if (title.indexOf(' |') != -1) {title = title.substring(0, title.indexOf(' |'));}
		    title = title[0].toUpperCase() + title.slice(1);
		    //
		    var container = url.substring(0, url.indexOf('/')); // Scrape container (website title)
		    if (container.indexOf('.') == container.lastIndexOf('.')){
		    	container = container.substring(0, container.indexOf('.'));
		    } else {
		    	container = container.substring(container.indexOf('.')+1, container.lastIndexOf('.'));
		    }
		    
			jsonfail = true;
		    if (url.includes("wikipedia")){
		    	container = "Wikipedia";
		    } else if (url.includes("kknews")){
		    	container = "每日頭條";
		    } else if (json){ // json method
		    	if (typeof JSON.parse(json).publisher != "undefined"){
		    		if (typeof JSON.parse(json).publisher.name != "undefined"){
		    			container = JSON.parse(json).publisher.name;
		    			jsonfail = false;
		    		}
		    	}
		    }

		    if (jsonfail && typeof $("meta[property='og:site_name']").attr("content") == "string"){ // <meta> tag method
		    	container = $("meta[property='og:site_name']").attr("content"); 
		    } else if (jsonfail && $('title').text().lastIndexOf('@') != -1){ // title slice method 1
		    	container = $('title').text().substring($('title').text().lastIndexOf('@ ')+1);
		    } else if (jsonfail && $('title').text().lastIndexOf('|') != -1){ // title slice method 2
		    	container = $('title').text().substring($('title').text().lastIndexOf('| ')+1);
		    } else if (jsonfail && $('title').text().lastIndexOf('–') != -1){ // title slice method 3
		    	container = $('title').text().substring($('title').text().lastIndexOf('– ')+1);
		    }

		    container = container[0].toUpperCase() + container.slice(1);
		    //
		    var publisher = ""; // Scrape publisher
		    var footerText = '';
		    if (url.includes("wikipedia")){ // wikipedia
		    	publisher = "Wikimedia Foundation";
		    } else if (url.includes("github") || url.includes("kknews")){ // github
		    	publisher = "";
		    } else if ($(":contains('opyright')").last().text() != "" || $(":contains('©')").last().text() != ""){  
		    	// copyright footer method
		    	if ($(":contains('opyright')").last().text() != ""){
		    		footerText = $(":contains('opyright')").last().text().trim();
		    		if (footerText.includes("opyright")){
		    			footerText = footerText.substring(footerText.indexOf('opyright')+8);
		    		}
		    		if (footerText.includes("©")){
		    			footerText = footerText.substring(footerText.indexOf('©')+2);
		    		}
		    	} else {
		    		footerText = $(":contains('©')").last().text().trim();
		    		footerText = footerText.substring(footerText.indexOf('©')+2);
		    	}

		    	publisher = footerText.replace(/[0-9]/g, ''); // footer parsing
		    	if (publisher.indexOf(';') != -1) {publisher = publisher.substring(0, publisher.indexOf(';'));}
		    	if (publisher.indexOf('.') != -1) {
		    		if (publisher.indexOf('.com') != -1){
		    			publisher = publisher.substring(0, publisher.indexOf('.com')+4);
		    		} else {
		    			publisher = publisher.substring(0, publisher.indexOf('.'));
		    		}
		    	}
		    	while (publisher[0] == " " || publisher[0] == "," || publisher[0] == "-" || publisher[0] == "~"){
		    		publisher = publisher.slice(1);
		    	}
		    	if (publisher.indexOf(',') != -1) {publisher = publisher.substring(0, publisher.indexOf(','));}

		    } else if (typeof $("meta[property='og:site_name']").attr("content") == "string"){ // <meta> tag method
		    	publisher = $("meta[property='og:site_name']").attr("content"); 
		    }

		    // publisher unnecessary if same as author/website title
		    if (publisher == author) { 
		    	publisher = "";
		    }
		    function RepeatedWords(sentence){
				sentence = sentence + " ";
				var regex = /[^\s]+/g;
				var regex2 = new RegExp ( "(" + container.match ( regex ).join ( "|" ) + ")\\W", "g" );
				matches = sentence.match ( regex2 );
				if (!matches){
					return "";
				}
				else{
					var words = {};
					for ( var i = 0; i < matches.length; i++ ) {
						var match = matches [ i ].replace ( /\W/g, "" );
						var w = words [ match ];
						if ( ! w )
						  words [ match ] = 1;
						else
						  words [ match ]++;
					}   
					return words;
				}
			}
			if (RepeatedWords(publisher).length != 0){ publisher = ""; }
		    
		    var publishDate = ""; // Scrape publish date
		    jsonfail = true;
		    if (json){ // json method
		    	if (json.indexOf('dateModified') != -1){
		    		publishDate = json.substring(json.indexOf('"dateModified"')+16, json.indexOf('"dateModified"')+27).replace('"', '').replace('T', '');
		    		jsonfail = false;
		    	} else if (json.indexOf('dateCreated') != -1) { 
		    		publishDate = json.substring(json.indexOf('"dateCreated"')+16, json.indexOf('"dateCreated"')+27).replace('"', '').replace('T', '');
		    		jsonfail = false;
		    	}
		    }
		    if (jsonfail){
		    	if (url.includes("kknews")){ // wikipedia
			    	var yr = new Date()
			    	publishDate = yr.getFullYear();
			    } else if ($("time").first() != ""){ // <time> tag method
		    		if ($("time").first().attr("datetime") != ""){
			    		publishDate = $("time").first().attr("datetime").substring(0,10).replace("T","");
			    	} else { publishDate = $("time").first(); } 
			    } else if ($(":contains('opyright')").last().text() != "" || $(":contains('©')").last().text() != ""){
			    	//copyright footer method
			    	publishDate = footerText.match(/\d+/g).toString(); // remove all non-numerical characters
			    	publishDate = publishDate.substring(publishDate.indexOf(',')+1); // extract most recent year
			    }
		    }
		    
		    // + formatting
		    if (author.match(/[\u3400-\u9FBF]/) || title.match(/[\u3400-\u9FBF]/)){
		    	console.log("chinese detected");
		    	// author = author.substring(0, author.length-1)+"：";
		    	// title = "〈"+title.substring(2, title.length-2)+"。〉";
		    	// url = "，"+url.substring(1, url.length-1)+"。"

		    }

		    // title = ' "'+title+'."'; 
		    // italicize container

		    citation.innerHTML = author+" | "+title+" | "+container+" | "
		    +publisher+" | "+publishDate+" | "+url;
		    
	})
});

// inText.innerHTML = "new in text";
