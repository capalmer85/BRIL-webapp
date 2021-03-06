//
// This is a module for faking mask data for the BCM1F detector, for demo purposes.
//
// The mask function creates a structure with four arrays, each with 12 binary values,
// and a made-up name for a tag. Choose this, quite arbitrarily, to be char[32] or so
//
// This code is used by the server, not the client.
//
"use strict";

var fs = require("fs");
var sqlite3 = require('sqlite3').verbose();
var bcm1fMaskDB = 'demo/bcm1fMask.db',
    dbExists = fs.existsSync(bcm1fMaskDB),
    db = new sqlite3.Database(bcm1fMaskDB);

if ( dbExists ) {
  console.log(now(),"BCM1F mask DB already exists");
} else {
  console.log(now(),"Populate BCM1F mask DB");
  db.serialize(function() {
    db.run("CREATE TABLE if not exists mask (detector TEXT, channel INT, masked BOOL)");
    var stmt = db.prepare("INSERT INTO mask VALUES (?,?,?)");
    for (var i=1; i <= 4; i++) {
      for (var j=1; j <= 12; j++) {
        stmt.run("BCM1F_" + i, j, false);
      }
    }
    stmt.finalize();
  });
}

module.exports = {
// wrap the function in module.exports{} to make it available to the server
  get: function(request,response) {
    var data = {
//    the four BCM1F detectors, unimaginatively named 1 through 4
      BCM1F_1:[0,0,0,0,0,0,0,0,0,0,0,0],
      BCM1F_2:[0,0,0,0,0,0,0,0,0,0,0,0],
      BCM1F_3:[0,0,0,0,0,0,0,0,0,0,0,0],
      BCM1F_4:[0,0,0,0,0,0,0,0,0,0,0,0],
//    a tag-name for the mask values. Assume char[32] for the layout
      tagName:'BCM1F_tag_2015-01-25'
    };

    response.writeHead(200,{
        "Content-type":  "application/json",
        "Cache-control": "max-age=0"
      });
    db.each("SELECT detector, channel, masked FROM mask",
      function(err, row) { // row callback
        if ( err ) { logVerbose(now()+"SELECT bcm1fMaskDB (row): "+err); }
        data[row.detector][row.channel-1] = row.masked;
      },
      function(err,rows) { // completion callback
        if ( err ) { logVerbose(now()+"SELECT bcm1fMaskDB (completion): "+err+"("+rows+" rows)"); }
        logVerbose(now()+JSON.stringify(data));
        response.end(JSON.stringify(data));
      }
    );
    // response.end(JSON.stringify(data));
    return;
  },

  put: function(request,response) {
//  this sets the mask bits according to the given values.
    var body = ""; // request body
    request.on('data', function(data) {
        body += data.toString();
    });
    request.on('end', function() {
      var mask = JSON.parse(body),
          error,
          f = function(err) { error = err; };

      console.log(now(),"Received BCM1F mask: " + JSON.stringify(mask));
      db = new sqlite3.Database(bcm1fMaskDB);
      db.serialize(function() {
        var stmt = db.prepare("UPDATE mask SET masked=(?) WHERE detector=(?) AND channel=(?)");
        for ( var detector in mask ) {
          for ( var chan in mask[detector] ) {
            var masked = mask[detector][chan],
                channel = parseInt(chan)+1;
            stmt.run(masked,detector,channel,f);
          }
        }
        stmt.finalize(function(err) {
          if ( err ) { logVerbose(now()+" bcm1f_mask:put stmt.finalize: "+err); }
          if ( error ) { // yes, 'error', because 'err' refers to the finalisation!
            console.log(now(),"Caught error:",error);
            response.writeHead(500, {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin' : '*',
              'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'
            });
            response.end("Set mask failed: "+error);
          } else {
            response.writeHead(200, {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin' : '*',
              'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'
            });
            response.end("Mask set OK");
          }
        });
      });
    });
  },
  path: [ "/get/bcm1f/mask", "/put/bcm1f/mask" ]
};
