
/********************************************
 *
 * Spit out a random number between 0 and 100
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

module.exports.run = function(request, cmd_args, stuart, plugin) {
	var num = Math.round(Math.random() * 100);
	stuart.slack_post(num.toString(), '#'+request.channel_name, request.user_name);
};

module.exports.help = function(request, stuart) {
	stuart.slack_post("Randomly picks a number between 0 and 100. Usage : '/stuart random'", '@'+request.user_name, request.user_name);
};