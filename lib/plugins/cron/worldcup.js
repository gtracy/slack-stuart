
/********************************************
 *
 * Deliver the weather forecast to the team
 * every morning
 *
 * Adapted from Sergio Behrends
 *    github.com/sbehrends/Live-WorldCup-Notification-for-Slack
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

var requestify = require("requestify");
var async = require("async");
var cronJob = require("cron").CronJob;
var logme = require("logme");

var Stuart = require('../../stuart');

var matchID = "";
var matchScore = "";
var match;

var cronTask = function() {
      logme.debug('Fetching World Cup update...');
	var plugin = this;

	// Get Match list
	requestify.get('http://live.mobileapp.fifa.com/api/wc/matches').then(function(response) {
	    var matches = response.getBody().data.group;

	    async.filter(matches, function(item, callback) {
	        callback (item.b_Live == true);

	    }, function(results){

            match = results[0];

            if (typeof match == "object") {
                  var homeTeamField = 'c_HomeTeam_' + (process.env.LANGUAGE || 'en');
                  var awayTeamField = 'c_AwayTeam_' + (process.env.LANGUAGE || 'en');

            	// Got Live Match!

            	if (match.n_MatchID != matchID) {
            		// New Match just started
            		matchID = match.n_MatchID;
            		matchScore = '';

            		// Notify New match
            		var text = 'Comienza '+match[homeTeamField]+ ' vs '+match[awayTeamField];
            		logme.debug(text);
                        Stuart.slack_post(text, '#'+plugin.config.channel);

            	} else if (matchScore != match.c_Score) {
            		// Different Score
            		matchScore = match.c_Score;

            		var text = match[homeTeamField]+ ' '+match.c_Score+' '+match[awayTeamField]+' ';

            		// Notify goal
            		logme.debug(text);
                        Stuart.slack_post(text, '#'+plugin.config.channel);
            	}

            }

	    });

      });
};


module.exports.register = function(plugin) {
      // 8:49am every morning
      new cronJob("*/5 * * * *", cronTask, null, true, "America/Chicago", plugin);
};