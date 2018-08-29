'use strict';
var express = require('express'),
     app = express()
var path = require('path')
var bodyParser = require('body-parser')
var cass = require('./app/controllers/cassandra.server.controller.js');
var dbConsole = require('./app/controllers/dbconsole.server.controller.js');
var localDB = '';
//var localDB = 'localhost';
var dbURL = 'mongodb://' + localDB + '/local';

const v8 = require('v8');

var intChecker = setInterval(() => {
  var memsize = v8.getHeapStatistics();
    const percentUsed = ((memsize.used_heap_size/memsize.heap_size_limit) * 100).toLocaleString('en-US', {minimumFractionDigits: 2});
    console.log('Heap percent Used',percentUsed + '%', 'max used: ');
 //   console.log(memsize);
    }, 30000);

app.use(express.static(__dirname + '/public'))
app.use('/favicon.ico', express.static(path.join(__dirname, '/public/images/favicon.ico')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

// Mongo Endpoints
app.get('/', (req, res) => {
  console.log('hitting main', __dirname)
  express.static(path.join(__dirname, '/public/index.html'))
})
app.get('/dbconsole/collections', dbConsole.getCollections);
app.post('/dbconsole/basicfind', dbConsole.basicFind);
app.post('/dbconsole/advancedFind', dbConsole.advancedFind);
app.post('/dbconsole/dropcoll', dbConsole.dropCollection);
app.get('/dbconsole/dropDB', dbConsole.dropDB);
app.get('/dbconsole/getStatus', dbConsole.getStats);
app.post('/dbconsole/changeServer', dbConsole.changeServer);
app.get('/dbconsole/dbStatus', dbConsole.dbStatus);
app.get('/dbconsole/listConnections', dbConsole.listConnections);
app.post('/dbconsole/deleteDocument', dbConsole.deleteDocument);
app.post('/dbconsole/collectionStatus', dbConsole.collectionStats);
app.post('/dbconsole/download', dbConsole.writeFile);
app.get('/dbconsole/getdbs', dbConsole.listDatabases);
app.post('/dbconsole/changedb', dbConsole.changeDB);
app.get('/dbconsole/convertCapped', dbConsole.convertCapped);
app.post('/dbconsole/sortRow', dbConsole.sortRow);
app.post('/dbconsole/updateDoc', dbConsole.updateDoc);
app.post('/dbconsole/createIndex', dbConsole.createIndex);
app.post('/dbconsole/ensureIndex', dbConsole.ensureIndex);
app.get('/dbconsole/special', dbConsole.specialUpdate);
app.post('/dbconsole/doAggregate', dbConsole.doAggregate);
app.get('/dbconsole/countColl', dbConsole.countCollections);
app.get('/dbconsole/convertRecipes', dbConsole.convertRecipes);
app.get('/dbconsole/restoreColl', dbConsole.readJSONFile);
app.get('/dbconsole/fixIds', dbConsole.fixIds);
app.post('/dbconsole/rawFind', dbConsole.rawFind);
app.get('/dbconsole/seekOutConflict', dbConsole.seekOutConflict);
app.post('/dbconsole/addConnection', dbConsole.addConnection);
app.get('/dbconsole/getConnections', dbConsole.getConnections);

// Cassandra endpoints
app.get('/cass/describeFull', cass.describeFull);
app.post('/cass/queryTable', cass.queryTable);
app.post('/cass/newTable', cass.newTable);
app.post('/cass/addKey', cass.createKeyspace);
app.post('/cass/addNewRecord', cass.addRow);

app.get('/testStuff', dbConsole.grabGoogle);

app.get('/testGo', (req, res) => {
    console.log(req);
    res.status(201).send("go back to yo momma");
});

app.get('/promises', (req, res) => {
    console.log('hitting promises')
    function countdown(seconds) {
        return new Promise(function(resolve, reject) {
            for(let i=seconds; i>=0;i--) {
                setTimeout(function(){
                    if(i===13) return reject(new Error("not counting"))
                    if (i>0) console.log(i + '...');
                    else resolve(console.log("GO"));
                }, (seconds-i)*1000);
            }
        })
    }

    const c = countdown(13);
    c.then(function() {
        console.log('countdown done')
    });
    c.catch(function(err) {
        console.log('countdown error' + err);
    })

})

var server = app.listen('5001', function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('listening at port:'+ port);
});

// catch 404 and forward to error handler

app.use(function(req, res, next) {
    console.log(req.url);
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
       console.log(err);
    });
}


module.exports = app;
