#Stuart

Stuart is an extensible Slack Bot. Ready to take on any task that you've programmed. He's intended to be run as a separate Node service. Once configured within your Slack instance, he will listen to your wishes and do the best he can to service you.

With Stuart, you can create customized commands that you can from inside of Slack. For instance, ask for a local lunch spot:

>/stuart food sushi
>
>So you're hungry, @greg?
>
>How about, *Osaka House* today? It has a Yelp rating of 2.5 / 5
>
>http://www.yelp.com/biz/osaka-house-madison
>
>505 State St

Stuart will also run automated tasks that happen in the background. For example, Stuart can let your team know what the weather forecast is every morning.

> Today in Madison : Partly Cloudy,
> Current temp : 72 (41 / 72)

He also comes with an SMS interface which allows you to inject content into Slack with his persona. Your own little puppet with your team.


##Getting Started
Note that the way in which the slash command is built, it *always* relies on the Incoming Webhooks to deliver the message. So you must configure both the slash command and the incoming webhooks to make this work. 

1. Configure your [Slack Integrations](https://slack.com/apps/manage)
    1. Create a new Slash Command
      * Name the command /stuart
      * Set the URL to be http://yourhostname/slack
      * Method should be POST
      * Label should be Stuart or whatever you name it in your config file
    1. Create an Inbound Webhook. Every message from Stuart will come via this webhook.
      * From the "Integration Settings"
          * Set the default channel you'd like (don't worry, Stuart can still post to any channel)
          * Set the bot name (Stuart)
          * Set the default bot avatar (also set in config.js)
1. Update config.js in your server project
    1. <b>host</b> : should match the hostname where you've deployed Stuart
    1. <b>slack\_host</b> : should match the "Webhook URL" setting found in your Inbound Webhook configuration
    1. <b>slack\_token</b> : should match the "Token" value found in your Slash Command configuration

##Let it rip!

    node slack-stuart.js

In your browser, visit:

    http://localhost:8087

##Plugins
Stuart is a pretty dumb by himself. But his future is bright. And it's in your hands. Plugin definitions are found in <b>plugins/plugins.json</b>.

By default, plugins that require configuration have their activation flag set to false. To enable them, update the "fixme" blocks and flip the activate property to true.

###Plugin Creation
Plugins come in one of two forms - slash command instructions and Cron tasks.

####Slash Command - /stuart
Integrate new commands directly into the /stuart slash command.

For example, this would call Stuart's random plugin from inside of Slack

> /stuart random

To create a new slash instruction, you need to write two methods - run() and help() - and define the plugin details in the plugins.json spec. For example, the random command has the following configuration:

JSON spec :

      "random" : {
        "active" : true,
          "name"   : "Random number generator",
          "hook"   : "./plugins/slash/random",
          "author" : "greg",
          "config" : {}
      }

* <b>active</b> is used enable/disable the plugin during server startup
* <b>name</b> is used when users ask Stuart for help (/stuart help).
* <b>hook</b> is the file which contains the plugin implementation.
* <b>author</b> should match the Slack username so Stuart can notify the plugin author in the event the plugin is broken.
* <b>config</b> is an object contains configuration parameters unique to the plugin integration. Check out some of the other plugins in package.json to see some configuration examples.

The code implemented in the "hook" file (in this case, ./plugins/slash/random) :

    module.exports.run = function(request, stuart, plugin) {
        var num = Math.round(Math.random() * 100);
        stuart.slack_post(num.toString(), '#'+request.channel_name, request.user_name);
    };

    module.exports.help = function(request, stuart) {
     stuart.slack_post("Randomly picks a number between 0 and 100. Usage : '/stuart random'", '@'+request.user_name, request.user_name);
    };

####Cron Tasks
Automated activities that run on a fixed schedule. There is no interface from within Slack to drive this activity. All of it is driven externally and the results are pushed into Slack via the Incoming Webhook.

To create a Cron task, you need to write one method - register() - and define the cron details in the plugins.json spec. For example, the inspire task has the following configuration:

JSON spec :

    "inspire" : {
      "active" : true,
      "name" : "Inspiring messages",
      "hook" : "./plugins/cron/inspire",
      "author" : "greg",
      "config" : {
        "channel" : "general"
      }
    }

The code implemented in the "hook" file (in this case, ./plugins/cron/inspire) :

    var cronJob = require('cron').CronJob;
    var Stuart = require('../stuart');

    // in this example, positive_quote() is another internal function not shown here
    var cronTask = function() {
        var plugin = this;
        Stuart.slack_post("_"+positive_quote()+"_", '#'+plugin.config.channel);
    };

    module.exports.register = function() {
        // 8:00am every Monday.
        new cronJob('43 7 * * 1', cronTask, null, true, "America/Chicago");
    };

###Tips for Testing
An easy way to test your integrations is to simply fire up a new instance of Slack. It's free and you can setup the slash command in inbound webook integrations just like you would with your production Slack instance.

If you're running on a localhost during test, you can use a tool like [ngrok](http://ngrok.com) to tunnel requests with a public hostname.
