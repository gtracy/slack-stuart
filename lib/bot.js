var request = require('request');
var logme = require('logme');

//
// Create a bot object based on the configuration
//
module.exports.botFactory = function(host, token, name, icon) {
	return new _slackbot(host, token, name, icon);
};


var _slackbot = function(host, token, name, icon) {
    this.endpoint = host;
    this.name = name;
	this.emoji = icon;
};

_slackbot.prototype.post = function(msg, channel, from, attachment, icon) {

	logme.debug('New SlackBot request being posted... '+msg+' (to '+channel+')');

	// setup the POST call to Slack's Incoming Webhook
	var request_params = {
	    uri: this.endpoint,
	    method: 'POST',
	    headers: {
		    'Content-Type': 'application/json'
	    }
	};

	var payload = {
		text : msg,
		channel : (channel === '#directmessage') ? '@'+from : channel,
		username : this.name,
		icon_emoji : (!icon) ? this.emoji : '',
		link_names : 1
	};
	if( attachment ) {
		payload.attachments = attachment
	}
	//logme.inspect(payload);
	request_params.body = JSON.stringify(payload);
    request(request_params, function(error, response, body) {
    	if( error ) {
    		logme.error('Slackbot failed to post : ');
    		logme.inspect(error);
		}
    });

};
