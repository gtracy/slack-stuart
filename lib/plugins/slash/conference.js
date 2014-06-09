
/********************************************
 *
 * Create a new Twilio conference room from
 * inside Slack
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

var logme = require('logme');
var config = require('../../../config');
var TwilioClient = require('twilio').RestClient;
var Stuart = require('../../stuart');


var CONFERENCE_LINE_NAME_PREFIX = 'slack-conference-';

// The flow for a new conference line...
//
// (1)  Find a new number
// (2)  Buy the number
// (3)  Setup the endpoint to receive calls on that number
//
// NOTE : This plugin presumes an endpoint is defined on the Node app
//     http://<HOST>/slack/conference
//
module.exports.run = function(request, stuart, plugin) {
	var cmd_password = request.text.substr(request.text.indexOf(" ") + 1);
	var password;
	if( cmd_password === 'conference' ) {
		logme.debug('create default password');
		// user didn't ask for a specific password so create one here.
		password = Math.round(Math.random() * (9998 - 1000) + 1000);
	} else {
		// validate the password the user gave us
		password = parseInt(cmd_password,10);
		if( isNaN(password) || password > 9999 || password < 1000 ) {
			stuart.slack_post("Your password must be a four-digit number. Please try again!","@"+request.user_name, request.user_name);
			return;
		}
	}
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
			var conf_name = request.user_name + 'slack';
			// setup the unique call handler for this line
			var voice_url = encodeURI(config.host + '/slack/conference?'
			    + 'name=' + conf_name
			    + '&password=' + password
			    + '&welcome=' + plugin.config.greeting);
			logme.debug(voice_url);

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
		            var verification = "Sweet. We've got your conference line setup."
		                + "\n&gt; number : " + num
		                + "\n&gt; password : " + password
		                + "\n&gt; expires : in " + plugin.config.max_age + " days";

					stuart.slack_post(verification, '@'+request.user_name, request.user_name);
                }
            });

		}
	});
};

module.exports.help = function(request, stuart) {
	stuart.slack_post("Instantly create a phone conference line Usage : \n\n'/stuart conference <4-digit passcode>'", '@'+request.user_name, request.user_name);
};

// This CRON task periodically cleans up old conference lines
//
var cronJob = require('cron').CronJob;
new cronJob('0 12 * * *', function() {
    var plugin = Stuart.get_plugin('conference');
	var client = require('twilio')(plugin.config.sid, plugin.config.auth_token);

    logme.debug('CRON task running to cleanup old conference lines...');
	client.incomingPhoneNumbers.list(function(err, data) {

	    data.incoming_phone_numbers.forEach(function(number) {
        	var age = (Date.now() - new Date(number.date_created)) / (1000*60*60*24*plugin.config.max_age);

	    	// ************************************************************** //
	    	// ************************************************************** //
	    	//    be super careful here. we're deleting twilio numbers!
	    	//    we're assuming all slack interactions have a name that
	    	//    starts with 'slack-conference-'. see the conference plugin for
	    	//    more details on how/when it gets named.
	    	// ************************************************************** //
        	logme.debug('... ' + number.friendly_name + ' : ' + number.friendly_name.indexOf(CONFERENCE_LINE_NAME_PREFIX) + ', age : ' + age);
	    	if( number.friendly_name.indexOf(CONFERENCE_LINE_NAME_PREFIX) >= 0 &&
	    		age > plugin.config.max_age ) {

		    	logme.critical('Deleting conference line : ' + number.friendly_name+" : "+number.phone_number+" : "+age+" : "+number.date_created);
		    	client.incomingPhoneNumbers(number.sid).delete(function(err) {
		    		if( err ) {
		    			logme.error('Twilio delete fail');
		    			console.dir(err);
		    		}
		    	});
		    }
	    	// ************************************************************** //
	    	// ************************************************************** //

	    });
	});
}, null, true, "America/Chicago");

