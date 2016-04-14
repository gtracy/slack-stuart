var events = require('events');
var logme = require('logme');
var fs = require('fs');
var _ = require('underscore');

var slackbot = require('./bot');
var config = require('../config');

function _Stuart() {

    this.slackbot = slackbot.botFactory(config.slack_host,
                                        config.slack_token,
                                        config.name,
                                        config.emoji);

    // Stuart's functionality lives in plugins
    this.commands = {};
    this.cron = {};

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
        logme.inspect(request);
        return('fuck off');
    }

    var cmd = request.text.split(' ')[0].toLowerCase();
    logme.info('... cmd is ' + cmd);

    // Service a HELP request
    //
    if( cmd === "help" ) {

        var output = "Those crazy devs are always adding new tricks, but here's what I've got right now...The format is always '/" + config.slash_command + " command' where command is one of the following :\n\n";
        var stuart_commands = this.commands;
        _.keys(this.commands).forEach(function(key) {
        	output += key + " - " + stuart_commands[key].name + "\n\n";
        });
        output += "\n\nIf you'd like to dig deeper, type '/" + config.slash_command + " <command> help' for each of the individual commands";
        this.slack_post(output, "@"+request.user_name);

    } else {  // Service a slash command

        var plugin = this.commands[cmd];
        if( _.isEmpty(plugin) ) {
        	logme.error('Illegal command : '+cmd);
        	this.slack_post("That command does not compute. Try asking me for help.", "@"+request.user_name);
    		} else {

            // Trap errors and let plugin authors know about it
            // when they fail during execution
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
	  return('');
}

// Instantiate the singleton
var stuart = new _Stuart();

/************************************************
 * Validate the configuration parameters
 ***********************************************/
stuart.slackbot.post("This is a test of the Stuart broadcasting system.",
                     "#nobodywillevernametheirchannelthis",
                     "@slackbot", "", config.emoji,
       function(error, response, body) {
          if( body !== 'channel_not_found' ) {
              logme.error("Ruh-roh. Looks like your configuration file isn't correct. ")
          } else {
              logme.info('So far so good. Your config file looks correct.');
              //
              // Initialize the plugins for Stuart!
              //
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
                          var plugin = stuart.commands[cmd];
                          logme.info('Activating : ' + plugin.name);

                          if( plugin.active === false ) {
                              logme.warning("... on second thought, it's inactive. Update the plugin spec to change this.");
                              stuart.commands = _.omit(stuart.commands,cmd);
                          } else {
                            	var handle = require(plugin.hook);
                            	if( typeof(handle.run) === 'function' &&
                            		  typeof(handle.help) === 'function' ) {

                            		  // finally... setup the listeners for
                                  // the command and corresponding help resources
                                	stuart.on(cmd, handle.run);
                                	stuart.on(cmd+'_help', handle.help);

                                  // some plugins have init scripts to run as well
                                  if( typeof(handle.init) === 'function' ) {
                                      handle.init(plugin);
                                  }
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
                      _.keys(stuart.cron).forEach(function(cron_name) {
                          var task = stuart.cron[cron_name];
                          logme.info('Activating : ' + task.name);

                          if( task.active === false ) {
                              logme.warning("... on second thought, it's inactive. Update the plugin spec to change this.");
                              stuart.cron = _.omit(stuart.cron);
                          } else {
                              // register the cron task
                              require(task.hook).register(task.config);
                          }
                      });

                  }
              });
            }
});




module.exports = stuart;
