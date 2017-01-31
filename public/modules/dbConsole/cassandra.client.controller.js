'use strict';


angular.module('app').controller('cassandraController', ['$scope','$http',
    function($scope,$http) {
        $scope.newTable = {};
        $scope.newRecord = {};
        $scope.newTable.columns = [{name: null, dataType: null, primaryKey: false}];
        $http.post('/cass/queryTable', {tableName: 'keyspaces', keyspaceName: 'system_schema'})
            .then(function onSuccess(data) {
                $scope.keyspaceList = data.rows;
                console.log( $scope.keyspaceList);
            });

        $scope.addKeyspace = null;
        $scope.describeFull = function() {
            $scope.addTable = false;
            $scope.addKeyspace = false;
            $http.get('/cass/describeFull')
                .then(function onSuccess(data) {
                    console.log(data);
                    $scope.tableList = data;
                    $scope.resultList = null;
                });
        };
        $scope.queryTable = function(table) {
            $scope.addKeyspace = false;
            $scope.tableSelected = table.table_name;
            $scope.keyspaceSelected = table.keyspace_name;
            $http.post('/cass/queryTable', {tableName: table.table_name, keyspaceName: table.keyspace_name})
                .then(function onSuccess(data) {
                    $scope.resultList = data;
                })
        }
        $scope.goHome = function() {
            window.location.href = '/';
        };

        $scope.showKeyspace = (() => {
            $scope.addTable = false;
            $scope.addKeyspace = true;
            $scope.resultList = null;
            $scope.tableList = null;
        })
        $scope.addKeyspaceFunc = function() {
            $scope.error = null;
            $http.post('/cass/addKey', {keyspaceName: $scope.newKeyspaceName, with: $scope.newKeyspaceWith})
                .then(function onSuccess(data) {
                    $scope.successMsg = data;
                })
            .catch((err) => {
                    $scope.error = err;
                })
        }

        $scope.showAddNewTableDiv = function() {
            $scope.addKeyspace = false;
            $scope.resultList = null;
            $scope.tableList = null;
            $scope.addTable = true;

        };

        $scope.addNewRow = function() {
            $scope.showNewDiv = false;
            console.log($scope.newRecord);
            $http.post('/cass/addNewRecord', {newRow: $scope.newRecord, table: $scope.tableSelected, keyspace: $scope.keyspaceSelected})
                .success((data) => {
                    $scope.successMsg = data;
                    $http.post('/cass/queryTable', {tableName: $scope.tableSelected, keyspaceName: $scope.keyspaceSelected })
                        .then(function onSuccess(data) {
                            $scope.resultList = data;
                        })
                })
                .catch((err) => {
                    console.log('error', err);
                    $scope.error = err;
                })
        };

        $scope.addTableColumn = function() {
            $scope.newTable.columns.push({name: null, dataType: null, primaryKey: false});
        }

        $scope.deleteColumn = function(index) {
            $scope.newTable.columns.splice(index, 1);
        }
        $scope.addTableFunc = (() => {
            $scope.error = null;
            console.log($scope.newTable);
            $http.post('/cass/newTable', {newTable: $scope.newTable})
                .then(function onSuccess(data) {
                    $scope.successMsg = data;
                })
            .catch((err) => {
                    $scope.error = err;
                })
        })


        $scope.dataTypeCodes = {
            34: 'set<text>',
            13: 'text',
            32: 'List',
            7: 'double',
            9: 'int',
            16: 'inet',
            33: 'map<text><text>',
            12: 'uuid',
            15: 'timeuuid',
            11: 'timestamp',
            4: 'boolean',
            3: 'mutation'
        }
        $scope.cassDataTypes = ['ascii','bigint', 'blob', 'boolean', 'counter', 'decimal', 'double', 'float',
            'frozen', 'inet', 'int', 'list', 'map', 'set', 'text', 'timestamp', 'timeuuid', 'tuple', 'uuid', 'varchar', 'varint']

    }]);
