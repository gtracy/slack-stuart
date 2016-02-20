var logme = require('logme');

var express = require('express');
var path = require('path');

var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var config = require('../config');

process.on('uncaughtException', function(err) {
    debugger;
    logme.error('Caught Error ' + err);
    if (err.stack) {
        logme.error('Stack ' + err.stack);
    }
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'uwotm8' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

// Define the webhook endpoints
require('../lib/routes/slack')(app);
require('../lib/routes/twilio')(app);

// Default root route for server
app.get('/', function(req,res,next) {
    res.send('Success! Stuart is running.');
});

// start the web application server
var port = config.port;
app.listen(port);
logme.info('Stuart started on port ' + port);
module.exports = app;
