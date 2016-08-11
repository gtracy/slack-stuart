/********************************************
 *
 * Thesaurus - Find synonyms and antonyms of a given word
 *
 * Author: Charlie Lor @lorcharlie
 *
 ********************************************/

const OK = 200;
const ALTERNATE = 303;
const NOTFOUND = 404;
const ERROR = 500;

var request = require('request');

var getNewWords = function(url) {
	request(URL, function(err, res, body) {
		console.log(res.statusCode);
	});
}

// Required hook -- run
module.exports.run = function(request, args, stuart, plugin) {
	// If arguments are correct, continue, else show HELP
	if (args.length === 1) {
		var footer = "Thesaurus service provided by words.bighugelabs.com";
		
		// API Key for Big Huge Thesaurus
		var key = plugin.config.key;
		
		// Version of API
		var version = plugin.config.version;
		
		// Format response
		var format = plugin.config.format
		
		// Get the word needing the thesaurus
		var word = args[0]
		
		// Set up the API URL
		var URL = "http://words.bighugelabs.com/api/" + version + "/" + key + "/" + word + "/" + format;
		
		console.log(URL);
		
		// Make the API call
		getNewWords(URL);
			
			
		// Filter out into syn and ant and select random 5
	
		// Want to post filtered results in the user's private channel instead of channel
	} else {
		
	}
}

// Required hook -- help
module.exports.help = function(request, stuart) {
	stuart.slack_post("Find synonyms and antonyms of a given word. Usage: '/stuart thesaurus [word]", '@'+request.user_name, request.user_name);
}