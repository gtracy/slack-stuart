/********************************************
 *
 * Spit out a link and title to a top 100 item
 *	on hacker news
 *
 * Author : Mark Abermoske @mabermoske
 *
 ********************************************/

 var https = require('https');
 var request = require('request');
 var logme = require('logme');
 var _ = require("underscore");

// fetches an array of the top 100 stories
// and return a random one
 var fetchHackerNewsTop = function(route, callback) {
 	request.get({
 		url: route,
 		headers: {
 			'Content-Type': 'application/json'
 		}
 	}, function(error, response, body) {
 		var data;
 		var results = {};
 		try {
 			data = JSON.parse(body);
 		} catch (err) {
 			logme.error('Unable to get list from hackernews');
 		}
 		if (data) {
 			console.dir(_.sample(data));
        }
        callback(_.sample(data));
        return;
    });
 };

// fetches the details of the story and returns
// the title and url
 var fetchStory = function(route, callback) {
 	request.get({
 		url: route,
 		headers: {
 			'Content-Type': 'application/json'
 		}
 	}, function(error, response, body) {
 		var data;
 		var results = {};
 		try {
 			data = JSON.parse(body);
 		} catch (err) {
 			logme.error('Unable to get story from hackernews');
 			logme.inspect(body);
 		}
 		if (data) {
 			console.dir(data);
 			results.title = data.title;
 			results.url = data.url;
 		}
 		callback(results);
 		return;
 	});
 };

 module.exports.run = function(request, cmd_args, stuart, plugin) {
 	fetchHackerNewsTop('https://hacker-news.firebaseio.com/v0/topstories.json', function(results) {
 		fetchStory('https://hacker-news.firebaseio.com/v0/item/' + results + '.json', function(results) {
 			stuart.slack_post(results.title + '\n' + results.url, '#'+request.channel_name, request.user_name);
 		});
 	});
 };

 module.exports.help = function(request, stuart) {
 	stuart.slack_post("Randomly provides a link to a hacker news story in the top 100. Usage : '/stuart hn'", '@'+request.user_name, request.user_name);
 };
