var searchZamunda = require("./SearchZamunda.js");
//var rss = require('node-rss');
var rss = require('rss');
var express = require('express')

var app = express()

app.get('/', function (req, res) {

    console.log("request start");

    var searchString = req.query.searchString;

    if (searchString) {
        searchZamunda(searchString)
            .then(function (searchResults) {

/*
                var feed = rss.createNewFeed('Search Zamunda for "' + searchString + '"',
                            'http://zamunda.net/',
                            'Search zamunda for torrents',
                            'AntSoft',
                            'http://someurl.com/rss/MostRecent.xml',
                            { 'CustomTag': 'This is a custom tag under the channel tag!' });
*/
                var feed = new rss({
                    title: 'Search Zamunda for "' + searchString + '"',
                    description: "Search zamunda for torrents"
                });

                var blogs = searchResults.map(function (value, index) {
                    return {
                        title: value.name,
                        url: value.downloadLink,
                        date: value.dateAdded.toUTCString(),
                        description: value.name + " " + value.cat
                    };
                });

                blogs.forEach(function (blog) {
                    feed.item(blog);
                });

                var xmlString = feed.xml({indent: true});

                res.send(xmlString);
                console.log("request end");
            })
            .catch(function (e) {
                res.status(500).send(e.message + e.stack);
                console.error("request end with error: " + e.message + e.stack);
            });
    }
    else {
        res.send("need request param: seachString!");
        console.log("request end");
    }
})

var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)
})
