var MongoClient = require("mongodb").MongoClient;
var express = require('express');
var app = express();

var dbUrl = "mongodb://url:fccFTW@ds153732.mlab.com:53732/fcc";

app.get("/new/*", function (request, response) {
  var url = request.params[0];
  MongoClient.connect(dbUrl, function(err, db) {
    if(err) {
      return response.end("Error 500" + err);
    }
    
    var collection = db.collection("url-shortener");
      
    collection.find({
      originalUrl: url
    }).toArray((err, docs) => {
      if(err) {
       return response.end("Error 500 " + err);
      }
      
      console.log("Docs", docs);
      
      if(docs.length != 0) {
        response.json({
          originalUrl: url,
          shortUrl: request.hostname + "/" + docs[0]._id
        });
      }else {
        
        var doc = {
          originalUrl: url
        };
        
        collection.find().sort({_id: -1}).limit(1).toArray((err, docs) => {
          if(err) {
            return response.end(err.toString());
          }
          
          if(docs.length == 0) {
            doc._id = 1;
          }else {
            doc._id = docs[0]._id + 1;
          }
          
          collection.insertOne(doc, function(err, r) {
            if(err) {
              return response.end(err.toString());
            }
            
            response.json({
              originalUrl: url,
              shortUrl: request.hostname + "/" + doc._id
            });                
          });
        });
        
        
      }
    });
  });
});

app.get("/:token", function (request, response) {
  var token = Number(request.params.token);
  
  if(isNaN(token)) {
    response.end("Bad token, must be a number");
  }
  
  MongoClient.connect(dbUrl, function(err, db) {
    if(err) {
      return response.end("Error 500" + err.toString());
    }
    
    var collection = db.collection("url-shortener");
    
    collection.find({
      _id: Number(token)
    }).toArray(function(err, docs) {
      if(err) {
        return response.end("Error 500" + err.toString());
      }
      
      console.log(docs);
      
      if(docs.length == 1) {
        response.redirect(docs[0].originalUrl);        
      }else {
        response.sendStatus(404);
      }
    })
  })
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
