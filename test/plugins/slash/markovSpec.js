var rewire = require("rewire");
var expect = require("chai").expect;
var markovStuartPlugin = rewire("../../../lib/plugins/slash/markov.js");
var markov = markovStuartPlugin.__get__("markov");

describe("Markov Stuart Plugin", function() {
    var mockRequest = { "user_name" : "foo"};
    var mockStuart = {
        postContent: null,
        postCalled: false,
        slack_post: function(content, channel, author) {
            this.postContent = content;

            expect(channel).to.equal('@' + mockRequest.user_name);
            expect(author).to.equal(mockRequest.user_name);

            this.postCalled = true;
        }
    };

    describe("#help()", function() {
        it("should post a usage message", function() {
            markovStuartPlugin.help(mockRequest, mockStuart);

            expect(mockStuart.postContent).to.contain("Markov chainer to entertain you with its ramblings. Usage: \n\n");
            expect(mockStuart.postCalled).to.be.true;
        });
    });

    describe("#run()", function() {
        it("should post a usage message if command not recognized", function() {
            markovStuartPlugin.run(mockRequest, ['unrecognized'], mockStuart, {});

            expect(mockStuart.postContent).to.contain("Markov chainer to entertain you with its ramblings. Usage: \n\n");
            expect(mockStuart.postCalled).to.be.true;
        });

        it("should post ramblings on the ramble command", function() {
            var RAMBLINGS = "Here are some mock ramblings.";

            markovStuartPlugin.__set__("markov", {
                ramble: function() {
                    return RAMBLINGS;
                }
            });

            markovStuartPlugin.run(mockRequest, ['ramble'], mockStuart, {});

            expect(mockStuart.postCalled).to.be.true;
        });

        it("should reset the corpus on the reset command", function() {
            var mockMarkov = {
                resetCalled: false,
                reset: function() {
                    this.resetCalled = true;
                }
            };
            markovStuartPlugin.__set__("markov", mockMarkov);

            markovStuartPlugin.run(mockRequest, ['reset'], mockStuart, {});

            expect(mockMarkov.resetCalled).to.be.true;
            expect(mockStuart.postCalled).to.be.true;
        });

        it("should teach the chainer new text on the learn command", function() {
            markovStuartPlugin.__set__("markov", {
                learn: function(text) {
                    expect(text).to.equal("The quick brown fox jumps over the lazy dog.");
                }
            });

            markovStuartPlugin.run(mockRequest, ['learn', 'The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog.'], mockStuart, {});

            expect(mockStuart.postCalled).to.be.true;
        });

        it("should post a message when there is no text to learn", function() {
            var mockMarkov = {
                learnCalled: false,
                learn: function(text) {
                    this.learnCalled = true;
                }
            }
            markovStuartPlugin.__set__("markov", mockMarkov);

            markovStuartPlugin.run(mockRequest, ['learn'], mockStuart, {});

            expect(mockStuart.postCalled).to.be.true;
            expect(mockMarkov.learnCalled).to.be.false;
        });
    });
});

describe("Markov Chainer", function() {
    describe("#reset()", function() {
        it("should reset to empty corpus", function() {
            markov.reset();

            expect(markov.corpus.size).to.equal(0);
        });
    });

    describe("#learn()", function() {
        it("should add word transitions to its 'corpus' for input with no repeating words", function() {
            markov.learn("The quick brown fox jumps over the lazy dog.");

            var corpus = markov.corpus;

            // corpus is a Map of Maps, where top level is each word and second level is count of each word that has succeeded top-level word.
            // this is a bit verbose - probably a fancy way to do a deep equals with chai
            expect(corpus.get("The").get("quick")).to.equal(1);
            expect(corpus.get("The").size).to.equal(1);
            expect(corpus.get("quick").get("brown")).to.equal(1);
            expect(corpus.get("brown").get("fox")).to.equal(1);
            expect(corpus.get("fox").get("jumps")).to.equal(1);
            expect(corpus.get("jumps").get("over")).to.equal(1);
            expect(corpus.get("over").get("the")).to.equal(1);
            expect(corpus.get("the").get("lazy")).to.equal(1);
            expect(corpus.get("lazy").get("dog.")).to.equal(1);
            expect(corpus.get("dog.").size).to.equal(0);
        });

        it("should count word transitions in its 'corpus' for input with repeating words", function() {
            markov.learn("Jack and Jill went up the hill, to fetch a pail of water.\nJack fell down and broke his crown, and Jill came tumbling after.");

            var corpus = markov.corpus;
            // this is a bit verbose - probably a fancy way to do a deep equals with chai
            expect(corpus.get("Jack").size).to.equal(2);
            expect(corpus.get("Jack").get("and")).to.equal(1);
            expect(corpus.get("Jack").get("fell")).to.equal(1);

            expect(corpus.get("Jill").size).to.equal(2);
            expect(corpus.get("Jill").get("went")).to.equal(1);
            expect(corpus.get("Jill").get("came")).to.equal(1);

            expect(corpus.get("and").size).to.equal(2);
            expect(corpus.get("and").get("Jill")).to.equal(2);
            expect(corpus.get("and").get("broke")).to.equal(1);
        });
    });

    describe("#ramble()", function() {
        afterEach(function() {
            markov.reset();
        });

        it("should ramble some text for input with no repeating words that is the same as the input", function() {
            markov.learn("The quick brown fox jumps over the lazy dog.");

            var ramblings = markov.ramble();
            expect(ramblings).to.equal("The quick brown fox jumps over the lazy dog.");
        });

        it("should ramble some text for input with repeating words that rambles a bit", function() {
            markov.learn("Jack and Jill went up the hill, to fetch a pail of water.\nJack fell down and broke his crown, and Jill came tumbling after.");

            var ramblings = markov.ramble();
            expect(ramblings).to.equal("Jack and Jill went up the hill, to fetch a pail of water.");
            // "Jack fell down and broke his crown, and Jill came tumbling after.";
        });

        it("should ramble starting with Hu", function() {
            markov.learn("Hu Zhengyan was a Chinese artist, printmaker and publisher. He worked in calligraphy, traditional Chinese painting, and seal-carving, but was primarily a publisher, producing academic texts as well as records of his own work.\nHu lived in Nanjing during the transition from the Ming dynasty to the Qing dynasty. A Ming loyalist, he was offered a position at the rump court of the Hongguang Emperor, but declined the post, and never held anything more than minor political office. He did, however, design the Hongguang Emperor's personal seal, and his loyalty to the dynasty was such that he largely retired from society after the emperor's capture and death in 1645. He owned and operated an academic publishing house called the Ten Bamboo Studio, in which he practised various multi-colour printing and embossing techniques, and he employed several members of his family in this enterprise. Hu's work at the Ten Bamboo Studio pioneered new techniques in colour printmaking, leading to delicate gradations of colour which were not previously achievable in this art form.\nHu is best known for his manual of painting entitled The Ten Bamboo Studio Manual of Painting and Calligraphy, an artist's primer which remained in print for around 200 years. His studio also published seal catalogues, academic and medical texts, books on poetry, and decorative writing papers. Many of these were edited and prefaced by Hu and his brothers.");

            var ramblings = markov.ramble();
            expect(ramblings).to.contain("Hu");
        });
    });
});