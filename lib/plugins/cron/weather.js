
/********************************************
 *
 * Deliver the weather forecast to the team
 * every morning
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

var logme = require('logme');
var request = require('request');
var cronJob = require('cron').CronJob;
var Stuart = require('../../stuart');

var fetchWeatherChannel = function(lat, lng, key, callback) {
    request.get({
        url: 'http://wxdata.weather.com/wxdata/obs_hirad/get.js?lat=' + lat + '&lng=' + lng + '&key=' + key,
        headers: {
            'Content-Type': 'application/json'
        }
    }, function(error, response, body) {
        var data;
        var results = {};
        try {
            data = JSON.parse(body);
        } catch (err) {
            logme.error('Unable to acquire weather data for lat/lng : '+lat+'/'+lng);
            logme.inspect(body);
        }
        if (data) {
        	console.dir(data);
            results.temp = data.temp;
            results.max = data.tempMax24;
            results.min = data.tempMin24;
            results.wSpeed = data.wSpeed;
            results.wDir = data.wDir;
            results.conditions = data['text'];
            results.icon = data.wxIcon;
        }
        callback(results);
        return;
    });
};

// Note that the this reference points to the context passed
// in by the cronJob definition below
var cronTask = function() {
    var plugin = this;
    logme.debug('Running weather cron task...');

    plugin.config.locations.forEach(function(location) {
        var lat = location.loc.split(',')[0];
        var lng = location.loc.split(',')[1];
        fetchWeatherChannel(lat, lng, plugin.config.api_key, function(results) {
            var output = "Today in _*" + location.name + "*_ : " + results.conditions + "\n"
              + "Current temp : " + results.temp + " (" + results.min + " / " + results.max + ")\n";
            if( results.wSpeed > 18 ) {
                output += "... and it's windy too! " + results.wSpeed + "mph.";
            }
            Stuart.slack_post(output, '#general');
        });
    });
};

module.exports.register = function(plugin) {
	// 8:49am every morning
	new cronJob('16 8 * * 0', cronTask, null, true, "America/Chicago", plugin);
};