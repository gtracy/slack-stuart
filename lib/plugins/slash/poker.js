/********************************************
 *
 * Play a game of 5 card draw
 *
 * Author : Dan Schumann @dasch
 *
 ********************************************/

var _ = require("underscore");

var SECOND = 1000;
var MINUTE = SECOND * 60;

var DISCARD_HELP = 
  '`/stuart poker discard 1 3 5` to discard your 1st, 3rd, and 5th card' + 
  ' or `/stuart poker discard` to discard no cards. Game ends after everyone does this';

// single game at a time
var game;

var Game = function(stuart, user_names, channel_name){
  this.id = 'Game #' + (''+Math.random()).substring(10);
  var _game = this;

  // stuart is not saved to instance for garbage collection purposes
  _game.user_names   = _.unique(user_names);
  _game.channel_name = channel_name;

  _game.players = {};

  // Expire games after 5 minutes in case someone is afk
  _game.timeout = setTimeout(function(){
    _game.reveal(stuart);
  }, 5*MINUTE);

};

_.extend(Game.prototype, {

  // Shuffles a deck and deals 5 cards to each player
  deal: function(stuart){

    var _game = this;

    _game.deck = _.flatten(_.map([':hearts:', ':diamonds:', ':spades:', ':clubs:'], function(suit){
      return _.map(_.range(2,11).concat('Jack', 'Queen', 'King', 'Ace'), function(c){
        return c + suit;
      });
    }));
    _game.deck = _.shuffle(_game.deck);

    _.each(_game.user_names, function(user_name){
      stuart.slack_post(
        _game.id + ' - ' +
        'Dealing' + 
        _.range(0,5).map(function(){return ':flower_playing_cards:'}).join(' ') +
        'to ' + user_name,
        '#'+_game.channel_name, user_name
      );
      
      _game.players[user_name] = {
        cards: _.range(0,5).map(function(){
          return _game.deck.pop();
        }),
      };

      stuart.slack_post(
        DISCARD_HELP,
        user_name, user_name
      );

      setTimeout(function(){
        _game.echoCards(stuart, user_name);
      }, 1*SECOND);

    });
  },

  echoCards: function(stuart, user_name){
    var _game = this;
    stuart.slack_post(
      _game.id + ' - ' +
      'Your cards are          ' + 
      _game.players[user_name].cards.join('      '),
      user_name, user_name
    );
  },

  discard: function(stuart, user_name, cards){
    var _game = this;
    var player = _game.players[user_name];

    // sanitize
    cards = _.unique(_.compact(_.map(cards, function(c){
      if (1 <= +c && +c <= 5) return +c;
    })));

    if (!player)
      return stuart.slack_post(
        _game.id + ' - ' +
        "You're not in the game! `/stuart poker deal @me @otherPerson` -- but be careful about interrupting another game!",
        user_name, user_name
      );

    if (player.discarded)
      return stuart.slack_post(
        _game.id + ' - ' +
        'You can\'t discard twice!',
        user_name, user_name
      );

    _.each(cards, function(n){
      player.cards[+n-1] = _game.deck.pop();
    });

    player.discarded = true;

    stuart.slack_post(
      _game.id + ' - ' +
      user_name + ' took ' + cards.length + ' cards ' + 
      _.range(0,cards.length).map(function(){return ':flower_playing_cards:'}).join(' '),
      '#'+_game.channel_name, user_name
    );

    _game.echoCards(stuart, user_name);

    if (! _.any(_game.players, function(p){return !p.discarded;}))
      setTimeout(function(){
        _game.reveal(stuart);
      }, .5*SECOND);

  },

  reveal: function(stuart){
    clearTimeout(this.timeout);

    var _game = this;
    _.each(_game.players, function(player, user_name){
      stuart.slack_post(
        _game.id + ' - ' +
        user_name + ' shows ' + player.cards.join('      '),
        '#'+_game.channel_name, user_name
      );
    });
    game = undefined;
  },

});

module.exports.run = function(request, _args, stuart, plugin) {
  var args = _.clone(_args);

  var channel_name = request.channel_name == 'directmessage' ? 'general' : request.channel_name;
  switch (args.shift()) {
    case 'deal':
      game = new Game(stuart, args, channel_name);
      game.deal(stuart);
      break;
    case 'discard':
      if (game)
        game.discard(stuart, '@' + request.user_name, args);
      break;
    case 'reveal':
      if (game)
        game.reveal(stuart);
      break;
  }
};

module.exports.help = function(request, stuart) {
  stuart.slack_post(
    'Play a game of poker with your friends. ' +
    ' `/stuart poker deal @you @player2 @player3 @player4`',
    '@'+request.user_name
  );

  setTimeout(function(){
    stuart.slack_post(DISCARD_HELP, '@'+request.user_name);
  }, .5*SECOND);

  setTimeout(function(){
    stuart.slack_post(
      'Game also ends automatically after 5 minutes, or by typing ' +
      '`/stuart poker reveal`', '@'+request.user_name);
  }, SECOND);
};
