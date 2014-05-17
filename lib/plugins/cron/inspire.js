
/********************************************
 *
 * Deliver an inspirational message to
 * the team every Monday morning
 *
 * Author : Greg Tracy @gregtracy
 *
 ********************************************/

var cronJob = require('cron').CronJob;
var logme = require('logme');
var Stuart = require('../../stuart');
var _ = require("underscore");


var quotes = [
	"'Dwelling on the negative simply contributes to its power.' -- Shirley MacLaine",
	"'Once you learn to quit, it becomes a habit.' -- Vincent Lombardi",
	"'The strangest and most fantastic fact about negative emotions is that people actually worship them.' -- P. D. Ouspensky",
	"'Half of the harm that is done in this world is due to people who want to feel important. They don’t mean to do harm but the harm does not interest them.' -- T.S. Eliot",
	"'Adopting the right attitude can convert a negative stress into a positive one.' -- Dr Hans Selye",
	"'Anger is one of the sinews of the soul; he that wants it hath a maimed mind.' -- Thomas Fuller",
	"'We despise all reverences and all objects of reverence which are outside the pale of our list of sacred things. And yet, with strange inconsistency, we are shocked when other people despise and defile the things which are holy to us.' -- Mark Twain",
	"'Wrongs are often forgiven, but contempt never is. Our pride remembers it forever.' -- Lord Chesterfield",
	"'True salvation is freedom from negativity, and above all from past and future as a psychological need.' -- Eckhart Tolle",
	"'People deal too much with the negative, with what is wrong. Why not try and see positive things, to just touch those things and make them bloom.' -- Thich Nhat Hanh",
	"'There are two ways of meeting difficulties: you alter the difficulties or you alter yourself meeting them.' -- Phyllis Bottome",
	"'The trick is in what one emphasizes. We either make ourselves miserable, or we make ourselves strong. The amount of work is the same.' -- Carlos Castaneda",
	"'Anger is the most impotent of passions. It effects nothing it goes about, and hurts the one who is possessed by it more than the one against whom it is directed.' -- Clarendon",
	"'The old saying that, 'success breeds succes.' -- has something to it. It’s that feeling of confidence that can banish negativity and procrastination and get you going the right way.' -- Donald Trump",
	"'Hatred – the anger of the weak.' -- Alphonse Daudet",
	"'If you are bent on revenge, dig two graves.' -- Old Chinese Proverb",
	"'To expect defeat is nine-tenths of defeat itself.' -- Francis Crawford",
	"'Nine times out of ten, and argument ends with each of the contestants more firmly convinced than ever that he’s absolutely right.' -- Dale Carnegie",
	"'The fear of being wrong is the prime inhibitor of the creative process.' -- Jean Bryant",
	"'If you accept the expectations of others, especially negative ones, then you never will change the outcome.' -- Michael Jordan",
	"'Stop worrying about the potholes in the road and celebrate the journey.' -- Barbara Hoffman",
	"'A pessimist is one who makes difficulties of his opportunities and an optimist is one who makes opportunities of his difficulties.' -- Harry Truman",
	"'Just can’t live that negative way…make way for the positive day.' -- Bob Marley",
	"'You cannot shake hands with a clenched fist.' -- Indira Gandhi",
	"'We have no problems, only situations. Not all problems have solutions, but all situations have outcomes.' -- John E. Gray",
	"'Social justice cannot be attained by violence. Violence kills what it intends to create.' -- Pope John Paul II",
	"'No matter how bad things get you got to go on living, even if it kills you.' -- Sholom Aleichem",
	"'The moment avoiding failure becomes your motivation, you’re down the path of inactivity. You stumble only if you’re moving.' -- Roberto Goizueta",
	"'Discontent is something that follows ambition like a shadow.' -- Henry H. Haskins",
	"'Once our minds are ‘tattooed’ with negative thinking, our chances for long-term success diminish.' -- John Maxwell",
	"'One good act of vengeance deserves another.' -- John Jefferson",
	"'Delete the negative;Accentuate the positive.' -- Donna Karan",
	"'Dwelling on the negative simply contributes to its power.' -- Shirley MacLaine",
	"'I never looked at the consequences of missing a big shot . . . when you think about the consequences you always think of a negative result.' -- Michael Jordan",
	"'You cannot escape the responsibility of tomorrow by evading it today.' -- Abraham Lincoln",
	"'The past is a guidepost, not a hitching post.' -- Thomas Holcroft",
	"'Victory has a hundred fathers but defeat is an orphan.' -- Galeazzo Ciano",
	"'Any fact is better established by two or three good testimonies than by a thousand arguments.' -- Nathaniel Emmons",
	"'Fear is that little darkroom where negatives are developed.' -- Michael Pritchard",
	"'The power of accurate observation is commonly called cynicism by those who have not got it.' -- George Bernard Shaw",
	"'Two wrongs don’t make a right.' -- Markuss Locklan",
	"'What goes around comes around.' -- Unknown",
	"'The best way of removing negativity is to laugh and be joyous.' -- David Icke",
	"'One can overcome the forces of negative emotions, like anger and hatred, by cultivating their counterforces, like love and compassion.' -- Dalai Lama	",
];

var positive_quote = function() {
	return _.sample(quotes);
};

var cronTask = function() {
	Stuart.slack_post("_"+positive_quote()+"_", '#general');
};

module.exports.register = function() {
    // 8:00am every Monday.
    new cronJob('43 7 * * 1', cronTask, null, true, "America/Chicago");
};


