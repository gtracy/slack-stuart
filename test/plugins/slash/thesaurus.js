var assert = require('assert');
var chai = require('chai');
// var chaiAsPromise = require('chai-as-promise');
var thesaurus = require('../../../lib/plugins/slash/thesaurus');

describe("Thesaurus", function() {
	var mockRequest = { "user_name": "foobar" };
	var mockStuart = {
		postContent: null,
		postCalled: false,
		slack_post: function(content, channel, author) {
			this.postContent = content;
			
			chai.expect(channel).to.equal('@' + mockRequest.user_name);
			chai.expect(author).to.equal(mockRequest.user_name);
			
			this.postCalled = true;
		}
	}
	
	describe("#help()", function() {
		it("Should display description and usage", function() {
			thesaurus.help(mockRequest, mockStuart);
			
			chai.expect(mockStuart.postContent).to.contain("Find synonyms, antonyms, similar and related words of a given word.\n\nUsage: */stuart thesaurus [word]*");
			chai.expect(mockStuart.postCalled).to.be.true;
		});
	});
	
	describe("#run()", function() {
		it ("Should display error if configuration is set up improperly", function() {
			thesaurus.run(mockRequest, ['greater'], mockStuart, { "config": {}});
			
			chai.expect(mockStuart.postContent).to.contain("Incorrect configuration -- Please fix!");
			chai.expect(mockStuart.postCalled).to.be.true;
		});
		
		it("Should display error and usage if the number args is greater than one", function() {
			thesaurus.run(mockRequest, ['greater', 'one'], mockStuart, { "config": { "key": "apikey", "version": 2 }});
			
			chai.expect(mockStuart.postContent).to.contain("Incorrect number of arguments.\n\nUsage: */stuart thesaurus [word]*");
			chai.expect(mockStuart.postCalled).to.be.true;
		});
		
		it("Should display error and usage if the number args is less than one", function() {
			thesaurus.run(mockRequest, [], mockStuart, { "config": { "key": "apikey", "version": 2 }});
			
			chai.expect(mockStuart.postContent).to.contain("Incorrect number of arguments.\n\nUsage: */stuart thesaurus [word]*");
			chai.expect(mockStuart.postCalled).to.be.true;
		});
		
		it("Should output correctly using the word 'user'", function() {			
			var args = ['user'];
			thesaurus.run(mockRequest, args, mockStuart, { "config": { "key": "apikey", "version": 2 }});
			
			chai.expect(mockStuart.postCalled).to.be.true;
		});
	});
});