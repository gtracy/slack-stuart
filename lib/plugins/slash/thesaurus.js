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
var logme = require('logme');
var _ = require('underscore');

// Return a Promise object after it retrieves data from API
function getWords(url, word) {
	return new Promise(function(resolve, reject) {
		// Call API to get syn/ant
		request.get({
			url: url
		}, function(err, res, body) {
			if (err) {
				logme.error("Error in request call: " + err);
				reject(err);
			} else {
				var data;
				switch (res.statusCode) {
					case OK:
						var result = {};
					
						// Try to parse data
						try {
							data = JSON.parse(body)
						} catch(err) {
							logme.error(err);
							reject(err);
						}
					
						if (data) {
							// noun/verb/adjectives
							var pos = _.keys(data);
							// For each part of speech
							_.each(pos, function(value, key, list) {
								var posVal = value;
							
								// If pos is undefined
								if (result[posVal] === undefined) {
									result[posVal] = {};
								}
							
								// syn/ant/usr/sim/rel
								var thes = _.keys(data[posVal]);
							
								// For each thes, put it in results
								_.each(thes, function(value, key, list) {
									// Get three random words if there are more than 3 words
									result[posVal][value] = _.sample(data[posVal][value], 3);								
								});
							});
							resolve(result);						
						}
						break;
					case ALTERNATE: // Probably not working since it forwards to the alternate word
						reject("Original word was not found but an alternate word has been found!");
						break;
					case NOTFOUND:
						reject("You searched for: *" + word + "*\n\nNo data could be found for the word or alternates");
						break;
					case ERROR:
						reject("Usage exceeded OR API key is invalid or inactive");
						break;
					default:
						reject("API error");
						logme.error("Error - Response code: " + res.statusCode);
						logme.error("URL: " + url);
						break;
				}
			}
		});
	})
}

module.exports.run = function(request, args, stuart, plugin) {
	// If arguments are correct, continue, else show usage
	if (args.length === 1) {
		// Get the word needing the thesaurus
		var word = args[0]
		
		if (Object.keys(plugin.config).length !== 2 || plugin.config.key === undefined || plugin.config.version === undefined) {
			logme.error("Configuration is wrong. Please provide the API key and/or the version of API.");
			stuart.slack_post("Incorrect configuration -- Please fix!", '@'+request.user_name, request.user_name);
		} else {
			var footer = "Thesaurus service provided by words.bighugelabs.com";
					
			// API Key for Big Huge Thesaurus
			var key = plugin.config.key;
		
			// Version of API
			var version = plugin.config.version;
		
			// Set up the API URL
			var url = "http://words.bighugelabs.com/api/" + version + "/" + key + "/" + word + "/json";
		
			// Make the API call and show in chat
			getWords(url, word).then(function(response) {
				// If results is defined, output result
				if (response) {
					var output = "You searched for: *" + word + "*\n\n";
			
					_.each(response, function(value, key, list) {
						if (key === "adjective") {
							output += "As an " + key + ": \n\n"
						} else {
							output += "As a " + key + ": \n\n"	
						}
					
						_.each(value, function(value, key, list) {
							var thesWord;
						
							switch (key) {
								case "syn":
									thesWord = "Synonym(s)";
									break;
								case "ant":
									thesWord = "Antonym(s)";
									break;
								case "sim":
									thesWord = "Similar";
									break;
								case "rel":
									thesWord = "Related";
									break;
								case "usr":
									thesWord = "User submitted"
									break;
								default:
									thesWord = "Other";
									break;
							}
						
							output += ">*" + thesWord + "*: " + value.join(", ") + "\n";
						});
				
						output += "\n\n\n";
					});
			
					output += footer;
		
					// Display output to user in their own channel
					stuart.slack_post(output, '@'+request.user_name, request.user_name);
				} else {
					stuart.slack_post("How did you get here?", '@'+request.user_name, request.user_name);
					logme.inspect(res);
					logme.error("results is not defined and switch didn't catch status code");
				}
			}, function(reject) {
				stuart.slack_post(reject, '@'+request.user_name, request.user_name);
			});
		}	
	} else {
		stuart.slack_post("Incorrect number of arguments.\n\nUsage: */stuart thesaurus [word]*", '@'+request.user_name, request.user_name);
	}
}

module.exports.help = function(request, stuart) {
	stuart.slack_post("Find synonyms, antonyms, similar and related words of a given word.\n\nUsage: */stuart thesaurus [word]*", '@'+request.user_name, request.user_name);
}