var logme = require('logme');
var twilio = require('twilio');
var _ = require('underscore');

var Stuart = require('../stuart');
var config = require('../../config');

module.exports = function(app) {

	app.post('/slack/conference',function(req,res,next) {
			console.dir(req.query);
			var name = req.query.name;
			var password = req.query.password;
			var welcome = req.query.welcome;
			logme.info('Twilio conference request for '+name+' / '+password);
			var twimlet = encodeURI("http://twimlets.com/conference?"
			    + "Name=" + name
			    + "&Music=ambient"
			    + "&Password=" + password
			    + "&Message=" + welcome);
			logme.info('Servicing... '+twimlet);
			res.redirect(twimlet);
	});

    // route messages that mention stuart to SMS
    //  Note: this requires additional outbound webhook configuration on Slack
    //  Note: make sure the caller_id config parameter in plugins.json matches
    //        the number used in the /sms/receive hook below
    //
	app.post('/slack/proxy', function(req,res,next) {

		if( req.body.user_name !== 'slackbot' && req.body.text.toLowerCase().indexOf(config.name.toLowerCase()) >= 0 ) {

			logme.info('Someboday mentioned ' + config.name + ' on ' + req.body.channel_name);
			var plugin = Stuart.get_plugin('conference');
			if( plugin.config.inbound_numbers && plugin.config.inbound_numbers.length > 0 ) {

			    var client = twilio(plugin.config.sid, plugin.config.auth_token);
			    client.sendMessage({
		            from : plugin.config.caller_id,
		            to : plugin.config.inbound_numbers[0],
		            body : req.body.channel_name + " : " + req.body.user_name + " : " + req.body.text
		        }, function(err,response) {
		            if(err) {
		                logme.error('Twilio message fail');
                        console.dir(err);
		            }
		        });

			}
		}
		res.status(200).json({text:''});
	});

    // secret handler that allows the cool kids to send messages
    // into the slack conversation on the behalf of Stuart
    //
    app.post('/sms/receive', function(req, res) {
    	var plugin = Stuart.get_plugin('conference');
        if( req.body.AccountSid === plugin.config.sid ) {
            logme.debug('inbound SMS message from '+req.body.From+' : '+req.body.Body);
            if( _.contains(plugin.config.inbound_numbers, req.body.From) ) {

            	// is the message designated for a specific channel?
            	var channel = '#general';
            	var msg = req.body.Body;
            	if( req.body.Body.indexOf('#') === 0 ) {
            		channel = req.body.Body.split(' ')[0];
            		msg = req.body.Body.substr(req.body.Body.indexOf(" ") + 1);
            	}
            	Stuart.slack_post(msg, channel);
            } else {
                logme.error('Fail : This number cannot post messages to slack');
            }
        } else {
        	logme.error('What?! Someone other than Twilio is posting to our endpoint');
        }
        res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>',200);
    });

};
