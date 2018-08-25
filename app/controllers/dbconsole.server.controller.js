'use strict';
var fs = require('fs-extra');
var url = 'mongodb://localhost:27017/mongoManager';
var localDb;
var request = require('superagent');
var dbConn;
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var async = require('async');
var localDb = 'mongodb://localhost:27017';
var dbSelected = 'mongoManager';
var replSetName;
function conMongo(callback) {
    if (!dbConn) {
        MongoClient.connect(url, {db: { autoReconnect: true, replicaSet: replSetName, connectTimeoutMS: 30000 }}, (err, db) => {
            if (err) {
                console.error(err);
            } else {
                dbConn = (!err ? db : null);
                callback(dbConn);
            }
        })
    } else {
        callback(dbConn);
    }
};

function convertToObjectId(idIn) {
    let aId;
    try {
        aId = new ObjectID(idIn);
    }
    catch(err) {
        console.log(err);
        aId = false;
    }
    return aId;
}


exports.getCollections = function(req,res){
    conMongo((db) => {
        if (db) {
            db.listCollections({}).toArray(function(error, names) {
                if (!error) {
                    res.status(200).send(names);
                } else {
                    console.log(error);
                    res.status(400).send(error);
                }
            })
        } else {
            res.status(400).send('cant establish connection');
        }

    })
};

exports.listDatabases = function(req, res) {
    conMongo((db) => {
        if (db) {
            var adminDb = db.admin();
            adminDb.listDatabases(function(sErr, info) {
                if (sErr) res.status(400).send(sErr);
                res.status(200).send(info);
            })
        }
    })
};

exports.changeDB = function(req, res) {
    dbConn = null;
    dbSelected = req.body.db;
    url = 'mongodb://'+ localDb  + '/' + dbSelected;
    conMongo((db) => {
        if (db) {
            db.listCollections({}).toArray(function(error, names) {
                if (!error) {
                    console.log(names);
                    res.status(200).send(names);
                } else {
                    console.log(err);
                    res.status(400).send(err);
                }
            })
        } else {
            res.status(400).send('cant establish connection');
        }
    })
}

exports.changeServer = function(req, res) {

    if (dbConn) dbConn = null;
    const parsedName = JSON.parse(req.body.newdb);
    console.log(parsedName.name);
    if (parsedName.name === 'local') {
        localDb = 'localhost:27017';
        url = 'mongodb://'+ localDb  + '/' + dbSelected;
        res.status(200).send('Database Changed to: ' + req.body.newdb);
    } else if (parsedName.name === 'mlab') {
        url = 'mongodb://bitcoinNodeApp:dzwBgvX7syuVCLqm2Ash@ds123956.mlab.com:23956/bitcoin'
        res.status(200).send('Database Changed to: ' + req.body.newdb);
    } else {
        console.log(req.body);
        localDb = parsedName.connAddress;
        url = 'mongodb://' + parsedName.UN + ':' + parsedName.PW + localDb;
        res.status(200).send('Database Changed to: ' + req.body.newdb);
    }

};

exports.collectionStats = function(req, res) {
    if (req.body.coll) {
        conMongo((db) => {
            var collection = db.collection(req.body.coll);
            collection.stats().then(function(stats) {
                res.status(200).send(stats);
            })
        })
    } else {
        res.status(400).send('Select a collection first');
    }

}

exports.basicFind = function(req,res){
    var starter = new Date();
    var endy;
    var query,numOfResults;
    var round = Math.round;
    req.body.limit = round(req.body.limit);
        conMongo((db) => {
            var collection = db.collection(req.body.collName);
            var findy = collection.find({}).limit(req.body.limit).toArray(function(err, results) {
                var endy = new Date();
                var qTime = endy - starter;
                res.status(200).send({r: results, count: results.length, queryTime: qTime});
            });
        })
};

exports.dropCollection = function(req,res){
  //  res.status(200).send('functionality disabled');
    conMongo((db) => {
        var collToDrop = db.collection(req.body.coll);
        collToDrop.drop(function(err, reply) {
            //   console.log(err, reply);
            res.status(200).send(reply);

        })
    })
};

exports.advancedFind = function(req,res){
    var starter = new Date();
    var endy, toAppend, searchObj;
    var query;
   // var aId = new ObjectID(req.body.searchText);
    // var toAppend = req.body.searchText;

  //  var searchObj = {'clientRefId': req.body.searchText};
    if (req.body.searchKey === '_id') {
        var aId = new ObjectID(req.body.searchText);
        searchObj = {'_id' : aId};
    } else {
        toAppend = {$regex: req.body.searchText, $options:'i'};
        var searchStr = '{"'+req.body.searchKey + '":"' + 'temp' + '"}';
        searchObj = JSON.parse(searchStr);
        searchObj[req.body.searchKey] = toAppend;
    }

   conMongo((db) => {
       var collection = db.collection(req.body.collName);
       collection.find(searchObj).toArray(function (err, docs) {
           if (err) {
               return res.status(400).send({
                   message: err
               });
           } else {
               var endy = new Date();
               var qTime = endy - starter;
               res.status(200).send({r: docs, count: docs.length, queryTime: qTime});
           }
       })
   })
};

exports.writeFile = function(req,res){
    var batLocation = './public/jsonFiles/' + req.body.coll + '.json';
    var pathToFile = '/jsonFiles/' + req.body.coll + '.json';
    conMongo((db) => {
        var collection = db.collection(req.body.coll);
        collection.find({}).toArray(function (error, docs) {
            if (error){
                return res.status(400).send({
                    message: 'Can not find any collection records'
                });
            } else {
                fs.writeJson(batLocation,docs, function(writeErr){
                    if(writeErr) {
                        console.log(writeErr);
                    } else{
                        res.status(200).send({path:pathToFile});

                    }
                });
            }

        })
    });
};

exports.dropDB = function(req, res) {
    res.status(400).send('functionality disabled to prevent fuck ups');
    //MongoClient.connect(url,function(err, db) {
    //     db.dropDatabase(function(err, result) {
    //       if (err) console.log(err);
    //       console.log(result);
    //     });
    //})
}

exports.getStats = function(req,res){
  conMongo((db) => {
      if (db) {
          var adminDb = db.admin();
          adminDb.serverStatus(function(sErr, info) {
              res.status(200).send(info);
          })
      }
  })
};

exports.dbStatus = function(req, res) {
  conMongo((db) => {
        db.stats(function(err, info) {
            res.status(200).send(info);

        })
    })
}

exports.listConnections = function(req, res) {
 conMongo((db) => {
      db.connections({$all: true}, function(error, info) {
          if (error) console.log(error);
          res.status(200).send(info);
      })
  })
};

exports.deleteDocument = function(req, res) {
    conMongo((db) => {
        var dId = convertToObjectId(req.body.docToDelete);
        var collToUpdate = db.collection(req.body.coll);
        collToUpdate.removeOne({_id: dId}, function(err, result) {
            if (!err) {
                res.status(200).send(result);
                console.log(err, result);
            } else {
                res.status(400).send(err);
            }

        });
    })
}

exports.editDocument = function(req, res) {
    conMongo((db) => {
        var collToUpdate = db.collection(req.body.coll);
        collToUpdate.updateOne({_id: uId}, req.body.newObject, (uErr, uResult) => {
            console.log(uErr, uResult);
        })
    });
}

exports.convertCapped = function(req, res) {
    conMongo((db) => {
        if (db) {
            db.command({"convertToCapped": "collectionEvents", size: 10485760}, {

            });
          //  db.createCollection( "collectionEvents", { capped: true, size: 1048576 } )
            res.status(200).send('good');

        }
    })
}

exports.sortRow = function(req, res) {
    var starter = new Date();
    var endy;
    var query,numOfResults;
    var round = Math.round;
    req.body.limit = round(req.body.limit);
    var sortObj = {};
    sortObj[req.body.sortRow] = req.body.sortOrder;
    conMongo((db) => {
        var collection = db.collection(req.body.collName);
        var findy = collection.find({}).limit(req.body.limit).sort(sortObj).toArray(function(err, results) {
            var endy = new Date();
            res.status(200).send({r: results, count: results.length});
            console.log('query time', endy - starter);
        });
    })
}

exports.updateDoc = function(req, res) {
    var newDoc = req.body.newDoc;
    console.log(newDoc._id);
    var editID = convertToObjectId(newDoc._id);
    delete newDoc._id;
    conMongo((db) => {
        var collection = db.collection(req.body.coll);
        collection.updateOne({_id: editID}, newDoc, (err, result) => {
            console.log(result, err);
            res.status(200).send('doc updated');
        })
    })
}

exports.specialUpdate = function(req, res) {
    //MongoClient.connect('mongodb://ec2-54-224-112-88.compute-1.amazonaws.com/placeable', {db: { autoReconnect: true }}, (err, db) => {
    //    var collection = db.collection('locations');
    //    collection.find({clientRefId: '542b258a3200002405379f29'},{_id:1, userFields: 1}).toArray((err, results) => {
    //
    //        async.eachSeries(results, function (item, callback) {
    //          // console.log(item.userFields);
    //            Object.keys(item.userFields).map((field) => {
    //                if (field === 'State (Province)' || field === 'Unique_ID' || field === 'Latitude' || field === 'Longitude' ||
    //                    field === 'Hours' || field === 'Photos' || field === 'City' || field === 'Postal Code' || field === 'Facebook' || field === 'Alt Phone' ||
    //                field === 'Phone Number' || field === 'Country' || field === 'Languages' || field === 'Yellow Pages' || field === 'Mobile Phone' || field === 'Street 2' ||
    //                field === 'Open Closed' || field === 'Yahoo' || field === 'Google+ Local' || field === 'Payment Types' || field === 'Bing' || field === 'Name' || field === 'Factual' ||
    //                    field === 'Yelp' || field === 'Local Page' || field === 'Fax Number' || field === 'Street' || field === 'Services 1' || field === 'Foursquare') {
    //                    delete item.userFields[field];
    //                    console.log('Will delete', field);
    //                }
    //            })
    //            console.log(item);
    //            collection.update({_id:item._id}, {$set: {userFields: item.userFields}}, function(updErr, updRes) {
    //               if (!err) callback()
    //            })
    //
    //        }, function done() {
    //            console.log('done');
    //        })
    //
    //
    //
    //    })
    //
    //})
}

exports.createIndex = function(req, res) {
    var indexObj = {};
    indexObj[req.body.searchKey] = 1;
    console.log(indexObj);
    conMongo((db) => {
        var collection = db.collection(req.body.coll);
        collection.createIndex(indexObj,(err, result) => {
            console.log(err, result);
            if (err) {
                res.status(400).send(err);
            } else {
                res.status(200).send(result);
            }
        })
    })
}

exports.ensureIndex = function(req, res) {
    var indexObj = {};
    indexObj[req.body.searchKey] = 1;
    conMongo((db) => {
        var collection = db.collection(req.body.coll);
        collection.ensureIndex(indexObj, (err, result) => {
            if (err) {
                res.status(400).send(err);
            } else {
                res.status(200).send(result);
            }
        })
    })
}

exports.doAggregate = function(req, res) {
    var starter = new Date();
    console.log(req.body);
    var parseSearch = JSON.parse(req.body.searchText);
    conMongo((db) => {
        var collection = db.collection(req.body.collName);
        collection.aggregate(parseSearch).toArray(function (err, docs) {
            if (err){
                return res.status(400).send({
                    message: err
                });
            } else {
                var endy = new Date();
                var qTime = endy - starter;
                res.status(200).send({r: docs, count: docs.length, queryTime: qTime});
            }
        })
    })
}

exports.countCollections = ((req, res) => {
    var wholeObj = [];
    conMongo((db) => {
        if (db) {
            var collection = db.collection('collection');
            collection.find({}).toArray(function(error, names) {
                if (!error) {
                    // console.log(names);
                    async.eachSeries(names,function (item, callback) {
                        var newColl = db.collection('items' + item._id);
                        const thisCount = newColl.count({},(err, con) => {
                            wholeObj.push({name: item.name, id: item._id, count: con});
                            callback()
                        });

                        }, () => {
                        res.status(200).send(wholeObj);
                    })



                } else {
                    console.log(err);
                    res.status(400).send(err);
                }
            })
        } else {
            res.status(400).send('cant establish connection');
        }
    })
})

exports.convertRecipes = ((req, res) => {
    conMongo((db) => {
        if (db) {
            var collection = db.collection('recipes');
            collection.find({queryFilter: {"$exists":"true"}}).toArray((err, rec) => {
                async.eachSeries(rec, (item, callback) => {
                    var newRecord = item.queryFilter;
                    if (newRecord.length > 0) {
                        for (var i =0; i<newRecord.length; i++) {
                            if (newRecord[i].type === 'Duplicates') {
                                newRecord[i].type = 'duplicate';
                            }
                            if (newRecord[i].type === 'pins' || newRecord[i].type === 'Pins') {
                                newRecord[i].type = 'pin';
                            }
                            if (newRecord[i].field === '' || newRecord[i].field === '--') {
                                newRecord[i].type = 'field';
                            }

                            if ( newRecord[i].field.indexOf('fields.') !== -1) {
                                newRecord[i].field = newRecord[i].field.substring(7);
                                newRecord[i].type = 'field';
                            }
                            if (newRecord[i].field.indexOf('pins.') !== -1 && newRecord[i].field.indexOf('.status') !== -1) {
                                const fieldLength = newRecord[i].field.length - 7;
                                newRecord[i].field = newRecord[i].field.substring(5, fieldLength);
                                newRecord[i].type = 'pin';
                            }

                            if (newRecord[i].field === 'errors.error') {
                                newRecord[i].type = 'flag';
                            }

                            if (newRecord[i].field === 'metaData.pinPlacementBucket') {
                                newRecord[i].type = 'confirm';
                                newRecord[i].field = 'verified';
                                newRecord[i].value = 'true';
                                newRecord[i].operator = 'equals';
                                // type is confirm
                                // value is true or false
                                // field is verified

                            }
                        }

                        collection.updateOne({_id: item._id}, {$set: {queryFilter: newRecord}}, (uErr, uResult) => {
                            if (uErr) {
                                console.log(uErr)
                            } else {
                                callback();

                            }
                        })
                    } else {
                        callback();
                    }



                }, (() => {
                    console.log('done with converting recipes');
                    res.status(200).send('Job Done');
                }))
            })
        }
    });
});

exports.readJSONFile = ((req, res) => {
    conMongo((db) => {
        if (db) {
            var collection = db.collection('OptimizeRecipes');
            fs.readJson('./QABackup.json', function (err, packageObj) {
                async.eachSeries(packageObj, (item, callback) => {
                    item._id = new ObjectID(item._id);

                    collection.insertOne(item, (error, result) => {
                        if (error) {
                            console.log(error)
                       } else {

                       }
                        callback();
                    })
                }, () => {
                    console.log('done with process');
                    res.status(200).send('done')
                });

            })
        }
    })

});

exports.fixIds = ((req, res) => {
    //conMongo((db) => {
    //    if (db) {
    //        var collection = db.collection('recipes');
    //        collection.find().toArray((err, rec) => {
    //            async.eachSeries(rec, (item, callback) => {
    //                const newId = new ObjectID(item.id);
    //                collection.updateOne({_id: item._id}, {$set: {_id: newId}}, (uErr, uResult) => {
    //                    if (uErr) console.log(uErr);
    //                    callback();
    //                });
    //
    //            }, () => {
    //                req.status(200).send('function completed')
    //                console.log('function completed');
    //            })
    //
    //
    //
    //
    //        })
    //
    //    }
    //})
});

exports.rawFind = ((req, res) => {
    var starter = new Date();
    var endy;
    var query,numOfResults;
    var round = Math.round;
    req.body.limit = round(req.body.limit);
    var aId = new ObjectID(req.body.searchText);
    conMongo((db) => {
        var collection = db.collection(req.body.collName);
        var findy = collection.find(JSON.parse(req.body.rawFind)).limit(req.body.limit).toArray(function(err, results) {
            console.log(err, results);
            var endy = new Date();
            var qTime = endy - starter;
            res.status(200).send({r: results, count: results.length, queryTime: qTime});
        });
    })
})

exports.grabGoogle = ((req, res) => {
    request
        .get('https://foursquare.com/v/5206f18f11d2c865de7f0d15')
        .set('Accept', 'application/json')
        .end(function(err, response){
            fs.writeJSON('./public/jsonFiles/responseFile.txt', response, function(writeErr){
                if(writeErr) {
                    console.log(writeErr);
                } else{
                    console.log(response.body);

                }
            });

        });
})

exports.seekOutConflict = ((req, res) => {
    var wholeObj = [];
    conMongo((db) => {
        if (db) {
            var collection = db.collection('collection');
            collection.find({}).toArray(function(error, names) {
                if (!error) {
                    // console.log(names);
                    async.eachLimit(names, 15, function (item, callback) {
                        var newColl = db.collection('items' + item._id);
                        const thisCount = newColl.count({'suggestions': {$exists:true, $size:1}},(err, con) => {
                            if (err) console.log(err);
                            console.log(con)
                            if (con > 0) {
                                wholeObj.push({name: item.name, id: item._id, count: con});
                            }
                            callback()
                        });
                    }, () => {
                        res.status(200).send(wholeObj);
                    })

                } else {
                    console.log(err);
                    res.status(400).send(err);
                }
            })
        } else {
            res.status(400).send('cant establish connection');
        }
    });

});

exports.addConnection = ((req, res) => {
    console.log(req.body);
    conMongo((db) => {
        const collection = db.collection('mongoConnections');
        collection.insertOne(req.body.newConn, function(err, result) {
            if (err) console.log(err);
            else res.status(200).send(result);
        })
    })
});

exports.getConnections = ((req, res) => {
    conMongo((db) => {
        const collection = db.collection('mongoConnections');
        collection.find({}).toArray((err, result) =>  {
            console.log(result);
            if (err) res.status(400).send(err);
            else res.status(200).send(result);
        })
    })
})
