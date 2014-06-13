var logme = require('logme');
var express = require('express');

var config = require('../config');

process.on('uncaughtException', function(err) {
    debugger;
    logme.error('Caught Error ' + err);
    if (err.stack) {
        logme.error('Stack ' + err.stack);
    }
});

// create the express web application server
var app = express();
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // simple logger
    app.use(function(req, res, next){
        logme.info(req.method + '  ' + req.url);
        next();
    });

    /**
     *  Default error handler when things go wrong
     **/
    app.use(function(err, req, res, next){
        logme.error(err.stack);
        res.json({error:'Internal Server Error'},500);
        next();
    });

    app.use(app.router);

    // Define the webhook endpoints
    require('../lib/routes/slack')(app);
    require('../lib/routes/twilio')(app);

    // Default root route for server
    app.get('/', function(req,res,next) {
        res.send('Success! Stuart is running.');
    });

});

// start the web application server
var port = config.port;
app.listen(port);
logme.info('Stuart started on port ' + port);
module.exports = app;
