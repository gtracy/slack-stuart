var logme = require('logme');

module.exports.purge_numbers = function(plugin, number_name_prefix) {

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
        	logme.debug('... ' + number.friendly_name + ' : ' + number.friendly_name.indexOf(number_name_prefix) + ', age : ' + age);
	    	if( number.friendly_name.indexOf(number_name_prefix) >= 0 &&
	    		age > plugin.config.max_age ) {

		    	logme.critical('Deleting conference line : ' + number.friendly_name+" : "+number.phone_number+" : "+age+" : "+number.date_created);
		    	client.incomingPhoneNumbers(number.sid).delete(function(err) {
		    		if( err ) {
		    			logme.error('Twilio delete fail');
		    			console.dir(err);
		    		}
		    	});
		    } else {
		    	logme.debug('... skip');
		    }
	    	// ************************************************************** //
	    	// ************************************************************** //

	    });
	});
};