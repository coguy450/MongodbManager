const cassandra = require('cassandra-driver');


const query = 'SELECT email, last_name FROM user_profiles WHERE key=?';
const client = new cassandra.Client({contactPoints: ['127.0.0.1']});
function executeQuery(query, req, res) {
    client.execute(query, function(err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        } else {
            res.status(200).send(result);
        }
    })
}
exports.describeFull = function(req, res) {

    const query = 'SELECT keyspace_name, table_name FROM system_schema.tables';
    client.execute(query, function(err, result) {
       if (err) {
           console.log(err);
           res.status(400).send(err);
       } else {
           res.status(200).send(result);
       }

    });
}

exports.queryTable = function(req, res) {
    var starter = new Date();
    var endy;
    const tableName = req.body.tableName;
    const keyName = req.body.keyspaceName;
    const query = 'SELECT * FROM ' + keyName + '.' +  tableName + ';';
    client.execute(query, function(err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        } else {
            var endy = new Date();
            var qTime = endy - starter;
            console.log(qTime);
            res.status(200).send(result);
        }

    });
};

exports.createKeyspace = function(req, res) {
    const withText = req.body.with ? req.body.with : '';
    const query = 'CREATE KEYSPACE ' + req.body.keyspaceName + ' WITH '  + withText + ';';
    console.log(query);
    client.execute(query, function(err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        } else {
            res.status(200).send(result);
        }
    });
}

exports.newTable = ((req, res) => {
    const newTable = req.body.newTable;
    let colList ='';
    const withVal = newTable.with ? 'WITH ' + newTable.with : '';
    newTable.columns.map((col) => {
        const primaryVal = col.primary ? 'PRIMARY KEY' : '';
        const staticVal = col.static ? 'STATIC' : '';
        colList += col.name + ' ' + col.dataType + ' ' + primaryVal + ' ' + staticVal + ',';

    });
    const query = 'CREATE TABLE ' + newTable.keyspaceName + '.' + newTable.name + ' ('  + colList + ') ' + withVal + ';';
    console.log(query);
    client.execute(query, function(err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        } else {
            res.status(200).send(result);
        }
    })
});

exports.addRow = ((req, res) => {
    const newRow = req.body.newRow;
    const table = req.body.table;
    const keyspace = req.body.keyspace;
    const query = "INSERT INTO " + keyspace + "." + table + " JSON " +  "'" + JSON.stringify(newRow) + "'" + ";";
   // const query = "INSERT INTO demo.testtwo(one) VALUES ('testValue');";
    executeQuery(query, req, res);
    console.log(query);

});

