var logme = require('logme');
/********************************************
 *
 * Ask Me Anything - an 8ball app
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

var _ = require("underscore");

var eight_ball_answers = [
    {string : "It is certain", postive : 1},
    {string : "It is decidedly so", postive : 1},
    {string : "Without a doubt", postive : 1},
    {string : "Yes definitely", postive : 1},
    {string : "You may rely on it", postive : 1},
    {string : "As I see it, yes", postive : 1},
    {string : "Most likely", postive : 1},
    {string : "Outlook good", postive : 1},
    {string : "Yes", postive : 1},
    {string : "Signs point to yes", postive : 1},
    {string : "Reply hazy try again", postive : 0},
    {string : "Ask again later", postive : 0},
    {string : "Better not tell you now", postive : 0},
    {string : "Cannot predict now", postive : 0},
    {string : "Concentrate and ask again", postive : 0},
    {string : "Don't count on it", postive : -1},
    {string : "My reply is no", postive : -1},
    {string : "My sources say no", postive : -1},
    {string : "Outlook not so good", postive : -1},
    {string : "Very doubtful", postive : -1}
];

var eight_ball = function() {
	return _.sample(eight_ball_answers);
}

// ask me anything - 8-ball answers
module.exports.run = function(request, cmd_args, stuart, plugin) {
    var meta = request.text.substr(request.text.indexOf(" ") + 1);
    if( cmd_args.length === 0 ) {
        stuart.slack_post('uhhhh. what is the question in your AMA request?', '@'+request.user_name, request.user_name);
    } else {
        stuart.slack_post(meta + '  :  _'+eight_ball().string+'_', '@'+request.user_name, request.user_name);
    }
};

module.exports.help = function(request, stuart) {
	stuart.slack_post("Ask me anything! Usage : \n\n'/stuart ama <your question>'", '@'+request.user_name, request.user_name);
};
