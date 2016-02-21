
/********************************************
 *
 * Spit out a random number between 0 and 100
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

module.exports.run = function(request, cmd_args, stuart, plugin) {
	var target_user = cmd_args[0];
	var msg = "Awww. Your friend, " + request.user_name + " sent you a flower. :tulip:";
    stuart.slack_post(msg, "@"+target_user);
};

module.exports.help = function(request, stuart) {
	stuart.slack_post("Send virtual flowers to your tribemate. Usage : '/stuart flowers @user'", '@'+request.user_name, request.user_name);
};