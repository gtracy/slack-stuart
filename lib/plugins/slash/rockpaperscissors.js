var logme = require("logme");
var Stuart = require('../../stuart');

// create a game of rock-paper-scissors that is scalable for more additions to the gameplay (e.g. lizard and spock)
function make_game(){
    
	var scoring_scheme= {};
	var choices=[]
    
	function set_score(winner,loser){
        if (!scoring_scheme[winner]) {scoring_scheme[winner] = {};}
        scoring_scheme[winner][loser]=1;
		if (choices.indexOf(winner)===-1){choices.push(winner);}
		if (choices.indexOf(loser)===-1){choices.push(loser);}
    }
    
	function validate(choice) {
        return choice in choices;
    }
   
   function result(input1,input2){
        if (input1 === input2){ return 'tie'; }
        return ( (scoring_scheme[input1][input2] === 1)? input1: input2 )+' wins!'; //note, change input1 and input2 so that program displays the slack users name
    }
    return {
        "set_score": set_score,
        "result": result,
        "validAction": validate,
		"choices": choices
    };
}





module.exports.run = function(request, cmd_args, stuart, plugin) {
    var user = request.user_name;
	var game = make_game();
	// note: if a relationship is left un-described, then it will always default to a loss for the first input
	game.set_score('rock','scissors');
	game.set_score('paper','rock');
	game.set_score('scissors','paper');
	
	
	
	
	var move = cmd_args.length >= 1 ? cmd_args[0] : '';
	var comp_move=game.choices[Math.floor(Math.random()*game.choices.length)];
	var game_result=game.result(move,comp_move)
	stuart.slack_post(game_result, '#'+request.channel_name, user);
	
}

module.exports.help = function(request, stuart) {
	var HELP = "Enter rock, paper, or scissors";
	stuart.slack_post(HELP,  '@'+request.user_name, request.user_name);
}
	

