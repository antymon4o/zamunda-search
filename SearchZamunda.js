var Promise = require("bluebird");

var request = require('request-promise');
var iconv = require('iconv-lite');
var jsdom = require("jsdom").JSDOM;
var fs = require("fs");
var _ = require("underscore");

var j = request.jar();

function setCookie(cookieVal) {
    var cookie = request.cookie(cookieVal.name + "=" + cookieVal.value);
    j.setCookie(cookie, "http://zamunda.net");
}

var cookies = [
    {
	name: "PHPSESSID",
	value: "udproa2kdvbiiertl51i9v7ga7"
    },
    {
        name: "_ddn_intercept_2_",
        value: "fb72da232e44d3e97efc38fdf9e4950d"
    },
    {
        name: "russian_lang",
        value: "no",
    },
    {
        name: "uid",
        value: "561759",
    },
    {
        name: "pass",
        value: "934b462acdd06a77ca8d91dbcff2a81c"
    },
    {
        name: "cats",
        value: "7",
    },
    {
        name: "periods",
        value: "7",
    },
    {
        name: "statuses",
        value: "1",
    }];

cookies.forEach(function (cookieVal) {
    setCookie(cookieVal);
});

var staticOptions = {
    url: 'http://zamunda.net/bananas', //browse.php',
    // proxy: "http://localhost:8888",
    headers: {
        "Accept": "text/html, application/xhtml+xml, */*",
        "Accept-Language": "en-US,en;q=0.7,bg;q=0.3",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; Touch; MALNJS; rv:11.0) like Gecko",
        "Accept-Encoding": "gzip, deflate"
        //Connection: Keep-Alive
        //Pragma: no-cache
    },
    jar: j,
    gzip: true,
    encoding: null,
    qs: {
        "search": null,
        "field": "name"
    }
};

var zamundaCategories = {
    "7": "Сериали",
    "33": "Сериали/HD"
};


function parseSearchResults($, columns) {
    //columns[0]
    var catLink = $(columns[0]).find("a")[0];
    var catLinkHref = catLink.getAttribute("href");

    var cat = /list\?cat=(\d+)/g.exec(catLinkHref)[1];

    //columns[1] - name, download links
    var name, downloadLink;
    $(columns[1]).find("a").each(function (index, value) {
        var href = value.getAttribute("href");
		
        if (/^banan/.test(href)) {
            //name
            name = value.textContent;
	}
 
        if (/^\/download.php\/(\d+)\//.test(href)) {
            //name
	    downloadLink = href;
        }
		
/*		
        if (/^banan/.test(href)) {
            //name
            name = value.textContent;
		} else {
			
			var downloadUrlMatch = (/^\/download_go.php\?id=(\d+)/.exec(href));
			
			if (downloadUrlMatch != null) {
				//download link
				
				var torrentId = downloadUrlMatch[1];
				downloadLink = "download.php/" + torrentId + "/";
			}
        }
*/
    });
    //columns[4] - date added
    var nobrElement = $(columns[4]).find("nobr")[0];
    var date = nobrElement.childNodes[0].nodeValue;
    var time = nobrElement.childNodes[2].nodeValue;

    var dateAdded = new Date(date + " " + time);

    return {
        name: name,
        downloadLink: "http://zamunda.net" + downloadLink,
        dateAdded: dateAdded,
        cat: zamundaCategories[cat]
    };

}

function searchZamunda(searchString) {
    
    var options = _.extend({}, staticOptions);
    options.qs.search = searchString;


    return request.get(options)
        .then(function (body) {
            var strBody = iconv.decode(body, 'win1251');
            return strBody;
        })  
        .then(function (strBody) {
            var window = (new jsdom(strBody)).window;
            return window;
        })
        .then(function (window) {
            var $ = require("jquery")(window);
            return Promise
                .resolve($("table.bottom table.test tr:gt(0)").toArray())
                .map(function (element) {
                    var columns = $(element).find("td");
                    return parseSearchResults($, columns);
                });
        });
}

module.exports = searchZamunda;
