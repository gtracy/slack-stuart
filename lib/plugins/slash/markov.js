/********************************************
 *
 * Enjoy the ramblings of a simple Markov chainer preloaded with Dickens.
 * Teach it new phrases!
 *
 * Author : Solomon Blaz @sblaz
 *
 ********************************************/

//
// A very simple (and pretty naive) Markov chainer.
//
// Feed it text with #learn(), spit out a chain of text with #ramble().
//
//
function _Markov() {
    // corpus is a Map of Maps where top-level key is a word, second level Map is a count of each word that has succeeded it
    // NOTE: probably would be best to track normalized weighted probabilities for each word transition, but this will work for now
    this.corpus = new Map();

    // counts transitions from each word to each succeeding word
    this.learn = function(input) {
        var me = this,
            words = input.split(new RegExp("\\s+")); // split on whitespace

        words.forEach(function (word, i) {
            var counts;
            if (me.corpus.has(word)) {
                counts = me.corpus.get(word);
            } else {
                counts = new Map();
                me.corpus.set(word, counts);
            }

            var nextWord = (i < words.length - 1 ? words[i + 1] : null);
            if (nextWord != null) {
                var count = counts.has(nextWord) ? counts.get(nextWord) : 0;
                count += 1;
                counts.set(nextWord, count);
            }
        });
    };

    // generate some text by making a random walk through known corpus of transitions from word to word.
    this.ramble = function() {
        var MAX_WORDS = 512, i = 0;
        var word = this.startingWord();
        var ramblings = word;

        while (word != null && i < MAX_WORDS) {
            var counts = this.corpus.get(word);
            word = this.nextWord(counts);
            if (word != null) {
                ramblings = ramblings + " " + word;
                i++;

                // end ramble on sentence boundaries
                if (word.match(/.*(\.|\!|\?|\'|\")/)) {
                    word = null;
                }
            }
        }
        return ramblings;
    };

    // pick a word to start the random walk from
    this.startingWord = function() {
        // could potentially track sentence starts to make this cool - for now just pick a word
        return this.corpus.keys().next().value;
    };

    // find the next word given the counts of each possibility
    //
    // NOTE: this part is a bit expensive and smelly, probably need to maintain the probabilities in the corpus data
    // structure so we can just look up the next word easily
    this.nextWord = function(counts) {
        if (!counts || counts.size === 0) {
            return null;
        } else if (counts.size === 1) {
            return counts.keys().next().value;
        }

        // calculate total
        var total = 0;
        counts.forEach(function(count, key) {
            total += count;
        });

        // pick a random next word, weighted by how frequently it has occurred - (could probably simplify by tracking weighted probabilities in an array)
        var random = Math.floor(Math.random() * total);
        var i = 0, result = null;
        counts.forEach(function(count, key) {
            i += count;
            if (i >= random && result == null) {
                result = key;
            }
        });

        return result;
    };

    // reset the 'corpus' of text we've seen
    this.reset = function() {
        this.corpus.clear();
    };
};

//
// Stuart Plugin
//

var HELP = "Markov chainer to entertain you with its ramblings. Usage: \n\n"
    + "/stuart markov ramble\n"
    + "/stuart markov learn <text>\n"
    + "/stuart markov reset";

// instantiate singleton and initialize with Dickens
var markov = new _Markov();
markov.learn("It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven,we were all going direct the other way--\nin short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.\nThere were a king with a large jaw and a queen with a plain face, on the throne of England; there were a king with a large jaw and a queen with a fair face, on the throne of France. In both countries it was clearer than crystal to the lords of the State preserves of loaves and fishes, that things in general were settled for ever.\nIt was the year of Our Lord one thousand seven hundred and seventy-five. Spiritual revelations were conceded to England at that favoured period, as at this. Mrs. Southcott had recently attained her five-and-twentieth blessed birthday, of whom a prophetic private in the Life Guards had heralded the sublime appearance by announcing that arrangements were made for the swallowing up of London and Westminster. Even the Cock-lane ghost had been laid only a round dozen of years, after rapping out its messages, as the spirits of this very year last past (supernaturally deficient in originality) rapped out theirs. Mere messages in the earthly order of events had lately come to the English Crown and People, from a congress of British subjects in America: which, strange to relate, have proved more important to the human race than any communications yet received through any of the chickens of the Cock-lane brood.\nFrance, less favoured on the whole as to matters spiritual than her sister of the shield and trident, rolled with exceeding smoothness down hill, making paper money and spending it. Under the guidance of her Christian pastors, she entertained herself, besides, with such humane achievements as sentencing a youth to have his hands cut off, his tongue torn out with pincers, and his body burned alive, because he had not kneeled down in the rain to do honour to a dirty procession of monks which passed within his view, at a distance of some fifty or sixty yards. It is likely enough that, rooted in the woods of France and Norway, there were growing trees, when that sufferer was put to death, already marked by the Woodman, Fate, to come down and be sawn into boards, to make a certain movable framework with a sack and a knife in it, terrible in history. It is likely enough that in the rough outhouses of some tillers of the heavy lands adjacent to Paris, there were sheltered from the weather that very day, rude carts, bespattered with rustic mire, snuffed about by pigs, and roosted in by poultry, which the Farmer, Death, had already set apart to be his tumbrils of the Revolution. But that Woodman and that Farmer, though they work unceasingly, work silently, and no one heard them as they went about with muffled tread: the rather, forasmuch as to entertain any suspicion that they were awake, was to be atheistical and traitorous.\nIn England, there was scarcely an amount of order and protection to justify much national boasting. Daring burglaries by armed men, and highway robberies, took place in the capital itself every night; families were publicly cautioned not to go out of town without removing their furniture to upholsterers' warehouses for security; the highwayman in the dark was a City tradesman in the light, and, being recognised and challenged by his fellow-tradesman whom he stopped in his character of 'the Captain,' gallantly shot him through the head and rode away; the mail was waylaid by seven robbers, and the guard shot three dead, and then got shot dead himself by the other four, 'in consequence of the failure of his ammunition:' after which the mail was robbed in peace; that magnificent potentate, the Lord Mayor of London, was made to stand and deliver on Turnham Green, by one highwayman, who despoiled the illustrious creature in sight of all his retinue; prisoners in London gaols fought battles with their turnkeys, and the majesty of the law fired blunderbusses in among them, loaded with rounds of shot and ball; thieves snipped off diamond crosses from the necks of noble lords at Court drawing-rooms; musketeers went into St. Giles's, to search for contraband goods, and the mob fired on the musketeers, and the musketeers fired on the mob, and nobody thought any of these occurrences much out of the common way. In the midst of them, the hangman, ever busy and ever worse than useless, was in constant requisition; now, stringing up long rows of miscellaneous criminals; now, hanging a housebreaker on Saturday who had been taken on Tuesday; now, burning people in the hand at Newgate by the dozen, and now burning pamphlets at the door of Westminster Hall; to-day, taking the life of an atrocious murderer, and to-morrow of a wretched pilferer who had robbed a farmer's boy of sixpence.\nAll these things, and a thousand like them, came to pass in and close upon the dear old year one thousand seven hundred and seventy-five. Environed by them, while the Woodman and the Farmer worked unheeded, those two of the large jaws, and those other two of the plain and the fair faces, trod with stir enough, and carried their divine rights with a high hand. Thus did the year one thousand seven hundred and seventy-five conduct their Greatnesses, and myriads of small creatures--the creatures of this chronicle among the rest--along the roads that lay before them.");

module.exports.run = function(request, cmd_args, stuart, plugin) {
    var user = request.user_name;
    var channel = '@' + user;

    var cmd = cmd_args.length >= 1 ? cmd_args[0] : '';
    if (cmd === 'ramble') {
        var ramblings = markov.ramble();
        if (ramblings == null) {
            stuart.slack_post("Markov chainer needs to learn some input before it can ramble. Please feed it with 'learn'.",
                channel,
                user);
        } else {
            stuart.slack_post(ramblings, channel, user);
        }
    } else if (cmd === 'learn') {
        if (cmd_args.length === 1) {
            stuart.slack_post("'learn' should be accompanied by some text.", channel, user);
            return;
        }

        var text = cmd_args.slice(1).join(' ');
        markov.learn(text);

        stuart.slack_post("Markov chainer has learned some new words and transitions, thanks!", channel, user);
    } else if (cmd === 'reset') {
        markov.reset();

        stuart.slack_post("Markov chainer no longer remembers any of its previous input, please feed it with 'learn'.",
            channel,
            user);
    } else {
        stuart.slack_post(HELP, channel, user);
    }
}

module.exports.help = function(request, stuart) {
    var user = request.user_name;
    var channel = '@' + user;

    stuart.slack_post(HELP, channel, user);
}