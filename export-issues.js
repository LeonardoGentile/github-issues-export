#!/usr/bin/env node

// export-issues.js
//------------------------------
//
// 2012-10-09, Jonas Colmsjö
//
// Copyright Gizur AB 2012
//
// Export the issues in a github repo to a CSV file
//
// dependencies: npm install jsdom@3 xmlhttprequest jquery yargs
//
// npm install (from packages.json)
//
//------------------------------



(function(){

// Includes
// ================

// The right way to require jsondom and jquery
// https://www.npmjs.com/package/jquery
require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }
    global.$ = require("jquery")(window);
    main();
});

var helpers = require('./helpers.js');
var argv = require('yargs')
    .usage('Usage: ./export-issues --owner [github owner of repo] --repo [github repo] --state [issues state] --bodynewlines [y/n] --body [y/n]')
    .demand(['token', 'owner', 'repo'])
    .argv;

var linkNextPage = null;
var vState = null;

// set logging level
logging.threshold  = logging.warning;

if (argv.bodynewlines == null || argv.bodynewlines == undefined) {
    argv.bodynewlines = 'y';
}

if (argv.body == null || argv.body == undefined) {
    argv.body = 'y';
}


// Globals
//==============

var sep    = ';';
var oauthToken = {};


// Functions
//==============


// getOauthToken
//-------------------------------------------------------------------------------------------------
//
// Equivalent of: curl -i -u colmsjo -d '{"scopes":["repo"]}' https://api.github.com/authorizations
//

// TODO:
function getOauthToken(user, password, token){

    logDebug('getOauthToken: Starting list authorization...');

    if (token) {
        oauthToken.token = token;
        return $.when(oauthToken); // already resolved promise
    }
    // TODO:
    // else {
    //     oauthToken = asyncObtainToken(user, password);
    // }
    }

}


//
// Parse HTTP Headers in order to get the link for next page
// ---------------------------------------------------------

function parseHttpHeaders(jqXHR) {

    // Parse the HTTP headers
    // -------------------------------------------

    // Split headers at newline into array
    var headersArray = jqXHR.getAllResponseHeaders().split("\r\n");

    // Crate JSON object to populate
    var headersJSON = {};

    // Iterate over HTTP headers
    $.each( headersArray, function(index, value){

        // Extract key and value for JSON object
        var delIdx = value.indexOf(":");
        var key    = value.substr(0, delIdx);
        var value  = value.substr(delIdx+1, value.length);

        // Update JSON object
        headersJSON[key.trim()] = value.trim();
    } );


    // Parse the HTTP Link header
    var linksArray = headersJSON.link != null ? headersJSON.link.split(",") : [];

    // Create JSON object
    var linksJSON = {};
    $.each( linksArray, function(index, value){
        var keyValue = value.split(";");
        linksJSON[keyValue[1].trim()] = keyValue[0].trim().substr(1, keyValue[0].trim().length-2 );
    });

    linkNextPage = linksJSON['rel="next"'];

    logDebug('parseHttpHeaders: metadata of response: ' + linksJSON['rel="next"'] );
 }


//
// List issues for the authenticated user
//-------------------------------------------------------------------------------
// Equivalent of: curl -i https://api.github.com/issues?access_token=OAUTH-TOKEN

function listMyIssues(){

    logDebug('listMyIssues: Starting getting my issues for...');
    log( ['comments', 'title', 'state', 'body', 'id' ].join(sep) );

      var request = $.ajax({

        url: 'https://api.github.com/issues?access_token=' + oauthToken.token,
        type: 'GET',


        success: function(data, textStatus, jqXHR){
            logDebug('listMyIssues: Yea, it worked...' + textStatus + ' - ' + JSON.stringify(data) );

            $.each( data, function(index, value) {
                value.body = value.body.replace(/(\r\n|\n|\r)/gm,"");

                log( [value.comments, value.title, value.state, value.body, value.id ].join(sep) );
            });

            parseHttpHeaders(jqXHR);
        },

        error: function(data){
            logErr('listMyIssues: Shit hit the fan...' + JSON.stringify(data));
        }

    });

    return request;

}


//
// List issues for a repo
//-----------------------

function listRepoIssuesHeader(){

    (argv.body === 'y') ? log( ['number', 'id' , 'title', 'state', 'created by', 'assigned to', 'created at', 'updated at', 'closed at', 'milestone', 'labels', 'comments', 'body'].join(sep) ) :
                  log( ['number', 'id' , 'title', 'state', 'created by', 'assigned to', 'created at', 'updated at', 'closed at', 'milestone', 'labels', 'comments'].join(sep) ) ;

}

function listRepoIssues(repo_url){

    logDebug('listRepoIssues: Starting getting issues for ' + repo_url + ' ...');

    var request = $.ajax({

        url: repo_url,
        type: 'GET',

        success: function(data, textStatus, jqXHR){
            logDebug('listRepoIssues: Yeah, it worked...' + textStatus + ' - ' + JSON.stringify(data) );


            // Print the result
            // ------------------

            $.each( data, function(index, value) {

                // Manage json objects that not are mandatory
                if(value.assignee == null)  value.assignee  = {login: 'not assigned'};
                if(value.milestone == null) value.milestone = {title: ''};

                if (argv.bodynewlines === 'n') {
                    value.body = value.body.replace(/(\r\n|\n|\r)/gm,"");
                }

                // create array of the labels
                var labels = [];
                $.each( value.labels, function(index, value) {
                    labels.push(value.name);
                });


                // Print the result to stdout
                (argv.body === 'y') ? log( [value.number, value.id, value.title, value.state, value.user.login, value.assignee.login, value.created_at, value.updated_at, value.closed_at, value.milestone.title,
                                    labels.join(','), value.comments, value.body].join(sep) ) :
                              log( [value.number, value.id, value.title, value.state, value.user.login, value.assignee.login, value.created_at, value.updated_at, value.closed_at, value.milestone.title,
                                    labels.join(','), value.comments].join(sep) ) ;
            });

            parseHttpHeaders(jqXHR);

        },

        error: function(data){
            logErr('listRepoIssues: Shit hit the fan...' + JSON.stringify(data));

        }

    });

    return request;

}

//
// List public gists for a user
//-----------------------------

function listGists(user){

    logDebug('listGists: Starting getting gists for colmsjo...');

    var request = $.ajax({

        // REST function to use
        url: 'https://api.github.com/users/' + user + '/gists',
        type: 'GET',

        dataType: 'jsonp',

        success: function(data){
            logDebug('listGists: Yea, it worked...' + JSON.stringify(data) );
        },

        error: function(data){
            logErr('listGists: Shit hit the fan...' + JSON.stringify(data) );

        }

    });

    return request;

}


// recurse
// =======
// Had to do some recursion in order to get fetch page by page synchronously
// with ajax (which is asynchronous)

function recurse() {
    if(linkNextPage != null) {
        $.when( listRepoIssues(linkNextPage) )
            .then( function() { recurse(); } )
            .fail( function() { logErr('Failed getting next page...'); } )
    }
}

// Main
//=========

function main(argument) {
    listRepoIssuesHeader();

    $.when(getOauthToken(argv.user, argv.password, argv.token))
        .then( function(token) {

            logDebug('$.when.then...');

            // open, closed,  all
            if (!argv.state || argv.state == "all") {
               vState = "all";
            }
            else vState = argv.state;

            linkNextPage = 'https://api.github.com/repos/' + argv.owner + '/' + argv.repo + '/issues?state=' + vState + '&access_token=' + oauthToken.token; // + '&per_page=100';

            recurse();

            if (argv.state == "all") {
                linkNextPage = 'https://api.github.com/repos/' + argv.owner + '/' + argv.repo + '/issues?state=closed&access_token=' + oauthToken.token; // + '&per_page=100';

                recurse();
            }

            //listMyIssues();
        })
        .fail( function() {
            logErr('Failed getting oAuth token...');
        });
}

})();
