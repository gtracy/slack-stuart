var events = require('events');
var logme = require('logme');
var fs = require('fs');
var _ = require('underscore');

var slackbot = require('./bot');
var config = require('../config');

function _Stuart() {

    this.slackbot = slackbot.botFactory(config.slack_host,
                                        config.name,
                                        config.emoji);

    // Stuart's functionality lives in plugins
    this.commands = {};
    this.cron = {};
    this.bots = {};

    // Method to post messages back to Slack
	this.slack_post = function(msg, channel, from, attachment) {
		this.slackbot.post(msg,channel,from,attachment);
	};

    // Method to access plugin details
    this.get_plugin = function(plugin_name) {
        var commands = this.commands;
        var cron = this.cron;
        var plugin;
        _.keys(commands).forEach(function(key) {
            if( key === plugin_name ) {
                plugin = commands[key];
            }
        });
        if( !plugin ) {
            _.keys(cron).forEach(function(key) {
                if( key === plugin_name ) {
                    plugin = cron[key];
                }
            });
        }
        return(plugin);
    }

	// inherit event emitter properties and functions
	events.EventEmitter.call(this);

	// @todo create a routine to track interactions

}
_Stuart.prototype.__proto__ = events.EventEmitter.prototype;

//
// Process inbound slash commands
//
_Stuart.prototype.slash_command = function(request) {
	logme.info('Slash command received : ' + request.text);

    // validate that the request came from our friends at Slack
    if( request.token !== config.slack_token ) {
        logme.error("Invalid request!?! Who sent this to us? It wasn't Slack!");
        return('fuck off');
    }


	var cmd = request.text.split(' ')[0].toLowerCase();
    logme.info('... cmd is ' + cmd);

    // Service a HELP request
    //
	if( cmd === "help" ) {

		var output = "Those crazy devs are always adding new tricks, but here's what I've got right now...The format is always '/stuart command' where command is one of the following :\n\n";
		var stuart_commands = this.commands;
		_.keys(this.commands).forEach(function(key) {
			output += key + " - " + stuart_commands[key].name + "\n\n";
		});
		output += "\n\nIf you'd like to dig deeper, type '/stuart <command> help' for each of the individual commands";
		this.slack_post(output, "@"+request.user_name);

	} else {  // Service a slash command

		var plugin = this.commands[cmd];
		if( _.isEmpty(plugin) ) {
			logme.error('Illegal command : '+cmd);
			this.slack_post("That command does not compute. Try asking me for help.", "@"+request.user_name);
		} else {

			// Trap errors and let plugin authors know about it
			// when they fail during registration
			try {

				// Service HELP requests for individual COMMANDs
				var meta = request.text.substr(request.text.indexOf(" ") + 1);
                logme.debug(meta);
				if( meta.indexOf('help') >= 0 ) {
					this.emit(cmd+'_help', request, this);
				} else {
                    // extract the command parameter from the request
                    var cmd_args = request.text.split(" ").slice(1);
                    this.emit(cmd, request, cmd_args, this, plugin);
				}

			} catch( e ) {
				logme.error('Plugin Error on '+cmd+' from '+this.commands[cmd].author);
				logme.error(e.name + ' :: ' + e.message);
				this.slack_post("Hmm. Your request ("+cmd+") failed. Don't worry! I've notified the author so they can fix it. Little rascal!","@"+request.user_name);
				this.slack_post("Dude. Your plugin just failed on "+cmd+" for "+request.user_name+". Feel shame. Here's what I found:\n\n", "@"+this.commands[cmd].author);
			}
		}
	}
	return '';
}

// Instantiate the singleton
var stuart = new _Stuart();

//
// Initialize the plugins for Stuart!
//
console.dir(__dirname);
var file = __dirname + '/plugins/plugins.json';
fs.readFile(file, 'utf8', function (err, data) {

    logme.info("Load up Stuart's plugins...");
    if (err) {
        logme.error("Error loading Stuart's plugins : " + err);
    } else {
        data = JSON.parse(data);

        // the plugin spec includes responsive plugins
        // for the /stuart command
        //
        stuart.commands = data.slash_command;
        logme.info('Plugins...');

    	/************************************************
    	 * Initialize all of the SLASH COMMANDS
    	 * described in the plugin spec
    	 ***********************************************/
        _.keys(stuart.commands).forEach(function(cmd) {

            if( stuart.commands[cmd].active === false ) {
                logme.warning(cmd + " is configured to be inactive. Update the plugin spec to change this");
                stuart.commands = _.omit(stuart.commands,cmd);
            } else {
            	var handle = require(stuart.commands[cmd].hook);
            	if( typeof(handle.run) === 'function' &&
            		typeof(handle.help) === 'function' ) {

            		// finally... setup the listeners for
                    // the command and corresponding help resources
                	stuart.on(cmd, handle.run);
                	stuart.on(cmd+'_help', handle.help);
                } else {
                	logme.error('Failed to register plugin '+p+' - missing run or help function.');
                }
            }
        });

        /************************************************
         * Initialize all of the CRON TASKS
         * described in the plugin spec
         ***********************************************/
        stuart.cron = data.cron;
        logme.info('CRON tasks...');
        _.keys(stuart.cron).forEach(function(task) {

            if( stuart.cron[task].active === false ) {
                logme.warning(task + " is configured to be inactive. Update the plugin spec to change this");
                stuart.cron = _.omit(stuart.cron);
            } else {
                // register the cron task
            	var handle = require(stuart.cron[task].hook);
            	handle.register(stuart.cron[task]);
            }
        });

    }
});

//
// Initialize the dynamic Bots
//
console.dir(__dirname);
var file = __dirname + '/bots/bots.json';
fs.readFile(file, 'utf8', function (err, data) {

    logme.info("Load up dynamic bots...");
    if (err) {
        logme.error("Error loading bots : " + err);
    } else {
        data = JSON.parse(data);

        // the plugin spec includes responsive plugins
        // for the /stuart command
        //
        stuart.bots = data.slash_command;
        logme.info('Bots...');

        /************************************************
         * Initialize all of the BOTS described in the
         * bot spec
         ***********************************************/
        _.keys(stuart.commands).forEach(function(cmd) {

            if( stuart.commands[cmd].active === false ) {
                logme.warning(cmd + " is configured to be inactive. Update the plugin spec to change this");
                stuart.commands = _.omit(stuart.commands,cmd);
            } else {
                var handle = require(stuart.commands[cmd].hook);
                if( typeof(handle.run) === 'function' &&
                    typeof(handle.help) === 'function' ) {

                    // finally... setup the listeners for
                    // the command and corresponding help resources
                    stuart.on(cmd, handle.run);
                    stuart.on(cmd+'_help', handle.help);
                } else {
                    logme.error('Failed to register plugin '+p+' - missing run or help function.');
                }
            }
        });

    }
});


module.exports = stuart;

