
/********************************************
 *
 * Rickroll a co-worker
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

var logme = require('logme');
var config = require('../../../config');
var TwilioClient = require('twilio').RestClient;
var Stuart = require('../../stuart');

var CONFERENCE_LINE_NAME_PREFIX = 'slack-conference-rickroll-';

//
// The flow...
//  1. Buy a phone number
//  2. Program the number with a custom endpoint
//  2. Slack the contact with the phone number
//
module.exports.run = function(request, cmd_args, stuart, plugin) {
	var target_user = cmd_args[0];
	var client = new TwilioClient(plugin.config.sid, plugin.config.auth_token);

	// go off and find and find a phone number in the area code
	client.availablePhoneNumbers('US').local.get({
	    areaCode : plugin.config.area_code
	}, function(searchError, searchResults) {

	    // handle the case where there are no numbers found
	    if (searchResults.availablePhoneNumbers.length < 1) {
	        stuart.slack_post('Oh noes! There are no phone numbers available right now!? Try again in a little bit.','@'+request.user_name, request.user_name);
	    } else {
	    	// buy the first number we find!
			var num = searchResults.availablePhoneNumbers[0].phoneNumber;
			// setup the unique call handler for this line
			var voice_url = encodeURI("https://dl.dropboxusercontent.com/u/147075/twilio/rickrollstart.xml");

			// buy and setup the number
            client.incomingPhoneNumbers.create({
                phoneNumber : num,
                voiceUrl : voice_url,
                voice_fallback_url : voice_url,
                voice_method : 'POST',
                FriendlyName : CONFERENCE_LINE_NAME_PREFIX + request.user_name
            }, function(buyError, number) {
                if (buyError) {
                    console.error('Buying the number failed. Reason: '+buyError.message);
                    stuart.slack_post("Oh noes! We couldn't buy your number. :( Try again in a bit.");
                } else {
                    logme.debug('Number purchased! Phone number is: '+number.phoneNumber);
		            var slack_msg = "Hey, @" + target_user + ". Can you give me a call quick? " + num;
		            logme.debug(slack_msg);
					stuart.slack_post(slack_msg, '@'+target_user, target_user);
                }
            });

		}
	});
};

module.exports.help = function(request, stuart) {
	stuart.slack_post("Rickroll your friends : \n\n'/stuart rickroll <username>'", '@'+request.user_name, request.user_name);
};

// This CRON task periodically cleans up old numbers
//
var cronJob = require('cron').CronJob;
new cronJob('5 12 * * *', function() {
    var plugin = Stuart.get_plugin('rickroll');

	var twilio = require('../utils/twilio');
	twilio.purge_numbers(plugin, CONFERENCE_LINE_NAME_PREFIX);

}, null, true, "America/Chicago");
