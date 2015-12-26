#Bot Design

(1) Migrate current implementation of lib/bot.js into lib/stuart.js
(2) Bot framework lives in lib/bots/
 - configuration in : lib/bots/bots.json
 - bots have names/accounts
 - bots have implementation directories - lib/bots/greg
 - bots are loaded from config file
(3) Every Bot has :
 - its own directory space
 - bot name (account)
 - a main method for starting the bot listener

* How does traffic get routed?

