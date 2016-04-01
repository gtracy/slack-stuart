/**********************************************
*
*Enter a zodiac sign and receive your horoscope! Don't worry about spelling
*just try to get it close!
*
*Author: Jack Michuda @jmichuda
*
***********************************************/

var logme = require('logme');
var request = require('request');
var Stuart = require('../../stuart');


/*Simple function with API integration. User inputs a zodiac sign and today's horoscope is read out. 
 *Misspelled entries are autocorrected to zodiac sign with smallest Levenshtein distance.
  *@param zodiac_sign
  *@param user
  *@param channel
 */
var fetchHoroscope=function(zodiac_sign, user, channel){
	var all_zodiacs=["aries", "taurus", "gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
	//spell check the input
	if (all_zodiacs.indexOf(zodiac_sign)===-1){
		zodiac_sign=spellCorrect(zodiac_sign,all_zodiacs);
		var correction="Did you mean: "+zodiac_sign+"?";
		Stuart.slack_post(correction,'#'+channel, user);
	}
	//access the API
	request.get({
		url: 'http://horoscope-api.herokuapp.com/horoscope/today/'+zodiac_sign,
		headers: {
			'Content-Type': 'application/json'
		}
	}, function (error,response,body){
		var data;
		var _horoscopes={};
		try{
			data=JSON.parse(body);
		} catch (err){
			logme.error('Unable to acquire horoscope for '+zodiac_sign)
			logme.inspect(body);
		}
		//extract and assign data from JSON 
		if (data){
			console.dir(data);
			_horoscopes.reading= data.horoscope
			_horoscopes.date=data.date
			_horoscopes.zodiac=data.sunsign
		}
		//print
	var output= "Your horoscope for "+ _horoscopes.zodiac + " for today, "+_horoscopes.date+": "+_horoscopes.reading;
	Stuart.slack_post(output,'#'+channel, user);
	return;
	});
	return
};

/*Iterates through the list of possible zodiac signs and returns the one with the smallest Levenshtein distance
 *@param zodiac_sign
 *@param all_zodiacs
 */
function spellCorrect(zodiac_sign, all_zodiacs){
	var zodiac_scores=[],i=0;
	for (i=0; i<all_zodiacs.length;i++){
		score=levenshteinDistance(zodiac_sign,all_zodiacs[i]);
		zodiac_scores.push(score);
	}
	low_score_index=zodiac_scores.indexOf(Math.min.apply(Math,zodiac_scores));
	
	return all_zodiacs[low_score_index];
};

/*Computes the Levenshtein Distance between two strings, returning a score that corresponds to the number of single character edits 
 *required to transform one string into the other
 *@param string1
 *@param string2
 */
function levenshteinDistance(string1, string2){
	var dp_table=[], i=0, j=0;
	for(i=0;i<=string1.length;i++){
		dp_table[i]=[i];
	}
	for (j=0;j<=string2.length;j++){
		dp_table[0][j]=j;
	}
	for (i=1;i<=string1.length;i++){
		for (j=1; j<=string2.length; j++){
			var sub_cost=1;
			if (string1.charAt(i-1)==string2.charAt(j-1)){
				sub_cost=0;
			}
			deletion=dp_table[i-1][j]+1;
			insertion=dp_table[i][j-1]+1;
			substitution=dp_table[i-1][j-1]+sub_cost;
			dp_table[i][j]=Math.min(substitution,Math.min(insertion, deletion));
		}
	}
	return dp_table[string1.length][string2.length];
};

/*Standard function to initialize code
 *@param request
 *@param cmd_args
 *@param stuart
 *@param plugin
 */
module.exports.run=function(request, cmd_args,stuart,plugin){
	var zodiac_sign= cmd_args.length>=1 ? cmd_args[0]:'';
	var user=request.user_name
	var channel=request.channel_name
	fetchHoroscope(zodiac_sign, user, channel);
};

module.exports.help = function(request, stuart) {
	var HELP = "Enter your zodiac sign";
	stuart.slack_post(HELP,  '@'+request.user_name, request.user_name);
};