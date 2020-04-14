
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
		    
		    // Scrape author
		    var author = "";
		    var jsonfail = true;

		    if (url.includes("wikipedia")){ // wikipedia
		    	author = "Wikipedia Contributors"; jsonfail = false;
		    } else if (typeof $("p[class='meta post-meta']").html() == "string"){ // kknews.cc
		    	ht = $("p[class='meta post-meta']").html();
		    	author = ht.substring(ht.indexOf("<em>")+4, ht.lastIndexOf("<a")-1)
		    	author = author.substring(author.indexOf("&#xA0")+6, author.lastIndexOf("&#xA0")-1);
	    		jsonfail = false;
	    	} else if (typeof $("meta[property='author']").attr("content") != "undefined"){
	    		author = $("meta[property='author']").attr("content"); jsonfail = false;
	    	} else if (json){ // json method
		    	try {
					if (typeof JSON.parse(json).author != "undefined"){
		    			if (typeof JSON.parse(json).author.name != "undefined"){
		    				author = JSON.parse(json).author.name;
		    			} else { author = JSON.parse(json).author; }
		    			if (typeof author != "string"){
		    				author = author[0];
		    				try { author = author.name;}
		    				finally {};
		    				if (typeof author != "string"){
		    					author = ""; jsonfail = true;
		    				} else {jsonfail = false;}
		    			} else {jsonfail = false;}
		    		} else { jsonfail = true; }
		    	}
		    	catch (SyntaxError){ jsonfail = true; };
		    } 

		    if (jsonfail){ // <meta> tag method
		    	if (typeof $("meta[name='author']").attr("content") != "undefined"){
		    		author = $("meta[name='author']").attr("content"); 
		    	} else if (typeof $("meta[property='article:author']").attr("content") != "undefined"){
		    		author = $("meta[property='article:author']").attr("content"); 
		    	}
		    }

		    	// format filters
		    // console.log(author);
		    if (author && author.indexOf('／') != -1) author = author.substring(0, author.indexOf('／'));
		    if (author && author.indexOf('-') != -1) author = author.substring(0, author.indexOf(' -'));
	    	if (author) author = author.replace("by", "").replace("By", "").replace("for", "").replace("For", "").replace("from", "").replace("From", "").replace("記者", "");
		    if (author) author = author.replace(/(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/, "").trim();

		    while (author.search(/[!@#$%^&*(),.?":{}|<>]/) != -1 && author[author.indexOf("&")+7] != ";") {
		    	var checkWords = author.substring(author.search(/[!@#$%^&*(),.?":{}|<>]/)+2).split(" ");
		    	var nameFound = false;
		    	const nameData = "Tyler Matthew Zion"; // should import namelist txt file
				checkWords.forEach(word => {if(nameData.includes(word)) {nameFound = true;}})
		    	if (nameFound) author = author.replace(", ", " and ");
		    	else author = author.substring(0, author.search(/[!@#$%^&*(),.?":{}|<>]/));
		    }

		    // Scrape title
		    var title = $("title").first().text().trim()
		    if (title.indexOf(' -') != -1) {title = title.substring(0, title.indexOf(' -'));}
		    if (title.indexOf(' –') != -1) {title = title.substring(0, title.indexOf(' –'));} // '-' length difference 
		    if (title.indexOf(' |') != -1) {title = title.substring(0, title.indexOf(' |'));}
		    title = title[0].toUpperCase() + title.slice(1);
		    
		    // Scrape container (website title)
		    var container = url.substring(0, url.indexOf('/')); // url method
		    if (container.indexOf('.') == container.lastIndexOf('.')){
		    	container = container.substring(0, container.indexOf('.'));
		    } else {
		    	container = container.substring(container.indexOf('.')+1, container.lastIndexOf('.'));
		    }
		    
			jsonfail = true;
		    if (url.includes("wikipedia")){
		    	container = "Wikipedia"; jsonfail = false;
		    } else if (url.includes("kknews")){
		    	container = "每日頭條"; jsonfail = false;
		    } else if (json){ // json method
		    	try {
		    		if (typeof JSON.parse(json).publisher != "undefined"){
		    			if (typeof JSON.parse(json).publisher.name != "undefined"){
		    				container = JSON.parse(json).publisher.name;
		    			}
		    			else { container = JSON.parse(json).publisher; }
		    			jsonfail = false;
		    		} else { jsonfail = true; }
				} catch (SyntaxError){ jsonfail = true; };
		    }

		    if (jsonfail){
		    	if (typeof $("meta[property='og:site_name']").attr("content") != "undefined"){
		    		container = $("meta[property='og:site_name']").attr("content");
		    	} else if ($('title').text().lastIndexOf('@') != -1){
	    			container = $('title').text().substring($('title').text().lastIndexOf('@ ')+1);
	    		} else if ($('title').text().lastIndexOf('|') != -1){
	    			container = $('title').text().substring($('title').text().lastIndexOf('| ')+1);
	    		} else if ($('title').text().lastIndexOf('–') != -1){
	    			container = $('title').text().substring($('title').text().lastIndexOf('– ')+1);
	    		}    
		    }

		    if (container) container = container[0].toUpperCase() + container.slice(1);
		    
		    // Scrape publisher
		    var publisher = "";
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
		    	if (publisher.indexOf(',') != -1) publisher = publisher.substring(0, publisher.indexOf(','));

		    } else if (typeof $("meta[property='og:site_name']").attr("content") == "string"){ // <meta> tag method
		    	publisher = $("meta[property='og:site_name']").attr("content"); 
		    }

		    	// publisher unnecessary if same as author/website title
		    if (publisher == author) publisher = "";
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
						var w = words[match];
						if ( ! w ) words[match] = 1;
						else { words[match]++;}
					}   
					return words;
				}
			}
			if (RepeatedWords(publisher).length != 0){ publisher = ""; }
			publisher = publisher.trim();
		    
		    // Scrape publish date
		    var publishDate = ""; 
		    var date = new Date()
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
		    console.log("publish date test");
		    if (jsonfail){
		    	if (url.includes("kknews")){ // wikipedia
			    	publishDate = date.getFullYear();
			    } else if (typeof $("time").first() != "undefined"){ // <time> tag method
		    		try {publishDate = $("time").first().attr("datetime").substring(0,10).replace("T","");}
					catch (TypeError) { publishDate = $("time").first(); } 
			    } else if ($(":contains('opyright')").last().text() != "" | $(":contains('©')").last().text() != ""){
			    	// + copyright footer method (does not work, conditions messed up)
			    	console.log('enters method')
			    	if ($(":contains('opyright')").last().text() != "") footerText = $(":contains('opyright')").last().text();
			    	else if ($(":contains('©')").last().text() != "") footerText = $(":contains('©')").last().text();
			    	console.log(footerText)
			    	publishDate = footerText.match(/\d+/g).toString(); // remove all non-numerical characters
			    	publishDate = publishDate.substring(publishDate.indexOf(',')+1); // extract most recent year
			    }
		    }
		    
		    // citation formatting
		    if (author.match(/[\u3400-\u9FBF]/) || title.match(/[\u3400-\u9FBF]/)){ // chinese format
		    	if (author != ""){ // author format
		    		if (author.indexOf("、") != -1) author = author.split("、")[0]+"及"+author.split("、")[1]; // two authors
		    		author += "：";
		    	}
		    	if (title != ""){
		    		if (!/[！。？⋯]/.test(title.slice(-1))) title = "〈"+title+"〉";
			    	else { title = "〈"+title.substring(0,title.length-1)+"〉"; }
		    	}
		    	if (container != "") container = "《"+container+"》";
		    	if (publishDate != ""){
		    		if (publishDate.toString().match(/[a-zA-Z]/)){ // + alphabet format
			    		console.log("alphabet date");
			    	} else{ 						// yyyy-mm-dd format
			    		if (publishDate.length == 10) publishDate = publishDate.substring(0,4)+"年"+
			    			parseInt(publishDate.substring(5,7))+"月"+parseInt(publishDate.substring(8))+"日";
			    		else {publishDate += "年";} // yyyy format
			    	}
		    	}

		    	var accessDate = date.getFullYear()+"年"+(date.getMonth()+1)+"月"+date.getDate()+"日。";

		    		// final format
		    	if (container!=""||publishDate!=""||publisher!="") accessDate = "，"+accessDate; 
		    	if (container!=""||publishDate!=""||publisher!="") url = "，"+url; 
			    if ((container!=""||publisher!="") && publishDate!="") publishDate = "，"+publishDate;
			    if (container != "" && publisher != "") publisher = "，"+publisher;
			    if (title != "" && container != "") container = "，"+container;

			    citation.innerHTML = author+title+container+publisher+publishDate+url+accessDate;
		    }
		    else { // english format
		    	if (author != ""){
		    		if (author.indexOf(" ") == author.lastIndexOf(" ") && author.indexOf(" ") != -1){ // one author
			    		author = author.split(" ")[1]+", "+author.split(" ")[0]+".";
			    	} else if (author.indexOf("and") != -1){ // two authors
			    		var author1 = author.split(" and ")[0].split(" ");
			    		author1 = author1[1]+", "+author1[0]+", and ";
			    		author = author1+author.split(" and ")[1]+".";
			    	} else { author += ". "; } // other author type
			    } 
			    if (title != ""){
			    	if (!/[!.?]/.test(title.slice(-1))) title = '"'+title+'."';
			    	else { title = '"'+title+'"'; }
			    }
			    container = container.italics(); // italicize container 
			    if (publishDate != ""){
			    	if (publishDate.match(/[a-zA-Z]/)){ // + alphabet format
			    		console.log("alphabet date");
			    	} else{
			    		if (publishDate.length == 10){ // yyyy-mm-dd format
			    			const monthNames = [" Jan. ", " Feb. ", " Mar. ", " Apr. ", " May ",
			    			" June ", " July ", " Aug. ", " Sep. ", " Oct. ", " Nov. ", " Dec. "];
			    			publishDate = publishDate.split("-");
			    			publishDate = parseInt(publishDate[2])+monthNames[parseInt(publishDate[1])-1]+publishDate[0];
			    		} else {} // yyyy format
			    	}
			    }
			    if ((container!=""||publishDate!=""||publisher!="") && url){ // final format
			    	url = ", "+url+".";
			    } else { url += "."; }
			    if ((container!=""||publisher!="") && publishDate!="") publishDate = ", "+publishDate;
			    if (container!="" && publisher!="") publisher = ", "+publisher;
			    if (author) title = " "+title;
			    if (author!=""||title!="") container = " "+container;
			    citation.innerHTML = author+title+container+publisher+publishDate+url;
		    }
	    
		    // in-text citation formatting
		    var citationList = [author, title, container, publisher];
		    var inTextList = []
		    if (author != ""){ 
		    	if (author.indexOf(" ") == author.lastIndexOf(" ") && author.indexOf(" ") != -1){ // one author
		    		citationList[0] = author.substring(0, author.indexOf(","));
		    	} else if (author.indexOf(",") != author.lastIndexOf(",") && author.indexOf(",") != -1){ // two author
		    		citationList[0] = author.split(", ")[0]+" and "+author.split(", ")[2].split(" ")[2];
		    	}
		    }
		    citationList.forEach(obj => {
		    	obj = obj.replace("《","").replace("》","").replace("：","");
		    	obj = obj.replace("〈","").replace("〉","").replace(".","");
		    	if (obj != "") inTextList.push(obj);
		    })
		    if (title.match(/[\u3400-\u9FBF]/)) { inText.innerHTML = "（"+inTextList[0]+"）"; }
		    else { inText.innerHTML = "("+inTextList[0]+")"; }

	})
});
