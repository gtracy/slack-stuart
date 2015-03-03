var logme = require('logme');
var twilio = require('twilio');

var Stuart = require('../stuart');


module.exports = function(app) {

	// The configured endpoint for the slash command - /stuart
	// This endpoint must be configured in Slack's
	// slash command integration
	app.post('/slack',function(req,res,next) {
		if( req.body.user_name !== 'slackbot' ) {
			//logme.inspect(req.body);
			var response_txt = Stuart.slash_command(req.body);
		}
		// note that if this response returns something, it will get
		// displayed in the channel from "slackbot". Returning an
		// empty string hides the response.
	    res.send(response_txt);
	});

};