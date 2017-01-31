'use strict';


angular.module('app').controller('dbConsoleController', ['$scope','$http',
    function($scope,$http) {
        $scope.dynHeaders =[];
        $scope.editShow = true;
        $scope.dbStats = false;
        $scope.collStatsShow = false;

        $scope.doFind = function(coll){
            $scope.showLoading = true;
            $scope.error = '';
            $scope.key = '';
            $scope.collViewing = coll;
            $scope.downloadLink = '';
            $http.post('/dbconsole/basicfind',{collName: coll,limit:$scope.limiter})
                .then(function onSuccess(data) {
                  console.log(data);
                  $scope.results = data.data.r;
                  $scope.qTime = data.data.queryTime;

                  $scope.countOfResults = data.data.count;
                    $scope.showLoading = false;
                })
                .catch(function(err){
                    $scope.error = err.message;
                });
        };
        $scope.advancedFind = function(){
            if ($scope.key){
                $scope.showLoading = true;
                $scope.error = '';
            $http.post('/dbconsole/advancedfind',{collName: $scope.collViewing,searchText:$scope.actionToDo,limit:$scope.limiter,searchKey:$scope.key})
                .then(function onSuccess(data) {
                    $scope.results = data.data.r;
                    $scope.showLoading = false;
                    $scope.qTime = data.data.queryTime
                    $scope.countOfResults = data.data.count;
                })
                .catch(function(err){
                    $scope.error = err.message;
                });
            } else {
                $scope.error = 'Please select a column to search on';
            }
        };
        $scope.searchKey = function(key){
            $scope.error = '';
            $scope.key = key;
        };
        $scope.dropCollection = function(){
            $http.post('/dbconsole/dropcoll',{coll: $scope.collViewing})
                .then(function onSuccess(data) {
                    window.location.reload();
                })
                .catch(function(err){
                    $scope.error = err.message;
                });
        };
        $scope.serverStatus = function() {
            $scope.results = null;
            $scope.statusData = true;
            $scope.collStatsShow = false;
            $scope.dbStats = false;
            $http.get('/dbconsole/getStatus')
                .then(function onSuccess(data) {
                $scope.statusData = data.data;
            })
        }
        $scope.doClear = function(){
            $scope.actionToDo = '';
            $scope.doFind($scope.collViewing);
        };
        $scope.changeDatabase = function(dbIn) {
            $scope.collList = null;
            $scope.error = null;
            $scope.filterColls = '';
            $scope.showLoading = true;
            $scope.statusData = null;
            $http.post('/dbconsole/changeServer', {newdb: dbIn})
                .then(function onSuccess(data) {
                $http.get('/dbconsole/getdbs')
                    .then(function onSuccess(info) {
                        $scope.collList = null;
                        $scope.showLoading = false;
                        $scope.dbList = info.data.databases;
                    })
                //
                //$http.get('/dbconsole/collections')
                //    .then(function onSuccess(c) {
                //        console.log(c);
                //         $scope.collList = c.data;
                //         $scope.showLoading = false;
                //    })
                //    .catch(function(err){
                //         $scope.error = err;
                //     });

              })
              .catch(function(err) {
                $scope.error = err.message;
              })
        };
        $scope.downloadColl = function(){
            $http.post('/dbconsole/download',{coll: $scope.collViewing})
                .then(function onSuccess(link) {
                    $scope.downloadLink = link.data;
                })
                .catch(function(err){
                    $scope.error = err.message;
                })

        }
        $scope.deleteDoc = function(doc) {
          $http.post('/dbconsole/deleteDocument', {coll:$scope.collViewing, docToDelete: doc})
              .then(function onSuccess(data) {
                  console.log(data);
                  $scope.doFind($scope.collViewing);
              })
        }
        $scope.dbStatus = function() {
            $scope.statusData = false;
            $scope.dbStats = true;
            $scope.collStatsShow = false;
            $http.get('/dbconsole/dbStatus')
                .then(function onSuccess(info) {
                    $scope.dbInfo = info.data;
                })
                .catch(function(err){
                    $scope.error = err.message;
                })
        }
        $scope.getConnections = function() {
            $http.get('/dbconsole/listConnections')
                .then(function onSuccess(info) {
                console.log(info);
            })
        }
        $scope.getdbs = function() {
            $http.get('/dbconsole/getdbs')
                .then(function onSuccess(info) {
                    $scope.collList = null;
                    $scope.dbList = info.data.databases;
                })
        }
        $scope.collectionStatus = function() {
            $http.post('/dbconsole/collectionStatus', {coll:$scope.collViewing})
                .then(function onSuccess(data) {
                    $scope.statusData = false;
                    $scope.dbStats = false;
                    $scope.collStatsShow = true;
                    $scope.collStats = data.data;
                    console.log(data);
                })
        }
        $scope.selectDB = function(dbSel) {
            $http.post('/dbconsole/changedb', {db: dbSel })
                .then(function onSuccess(data) {
                    $scope.dbList = null;
                    $scope.collList = data.data;
                })
        }
        $scope.runCommand = function(command) {
            $http.get('/dbconsole/convertCapped')
                .then(function onSuccess(data) {
                    $scope.error = 'Consider it capped boss';
                })
        }
        $scope.goSort = function(row, order) {
            if ($scope.sortedKey === row) {
                $scope.sortedKey = null;
            } else {
                $scope.sortedKey = row;
            }
            $http.post('/dbconsole/sortRow', {collName: $scope.collViewing, limit:$scope.limiter, sortRow: row, sortOrder: order})
                .then(function success(data) {
                    $scope.results = data.data.r;
                    $scope.showLoading = false;
                    $scope.qTime = data.data.queryTime
                    $scope.countOfResults = data.data.count;
                })
        }
        $scope.editDoc = function(doc) {
            $scope.docToEdit = JSON.stringify(doc);
            $scope.editShow = false;
        };
        $scope.updateDoc = function() {
            var parsedDoc = JSON.parse($scope.docToEdit);
            $http.post('/dbconsole/updateDoc', {newDoc: parsedDoc, coll: $scope.collViewing})
                .then(function onSuccess(data) {
                    $scope.editShow = true;
                })
        }
        $scope.cancelUpdate = function() {
            $scope.editShow = true;
            $scope.docToEdit = null;
        }
        $scope.createIndex = function() {
            $http.post('/dbconsole/createIndex', {coll:$scope.collViewing, searchKey:$scope.key})
                .then(function onSuccess(data) {

                })
        }
        $scope.ensureIndex = function() {
            if ($scope.key) {
                $scope.showLoading = true;
                $scope.error = '';
                $http.post('/dbconsole/ensureIndex', {coll:$scope.collViewing, searchKey:$scope.key})
                    .then(function onSuccess(data) {
                        $scope.error = data;
                    })
            } else {
                $scope.error = 'Please select a column to search on';
            }
        }
        $scope.doAggregate = function() {
            if (!$scope.collViewing || !$scope.actionToDo) {
                $scope.error = 'Select a column and put something in the field';
            } else {
                $scope.results = null;
                $scope.showLoading = true;
                $http.post('/dbconsole/doAggregate', {collName: $scope.collViewing,searchText:$scope.actionToDo,limit: $scope.limiter})
                    .then(function onSuccess(data) {
                        $scope.results = data.data.r;
                        $scope.showLoading = false;
                        $scope.qTime = data.data.queryTime

                    })
                    .catch(function(err){
                        $scope.error = err.message;
                    });
            }

        }
        $scope.seekConflict = (() => {
            $scope.showLoading = true;
            console.log($scope.editShow);
            $http.get('/dbconsole/seekOutConflict')
                .then(function onSuccess(data) {
                  console.log(data);
                  $scope.qTime = 100;
                  $scope.results = data.data;
                  $scope.showLoading = false;
                  $scope.countOfResults = 100;
                })
        })
        $scope.goHome = function() {
            window.location.href = '/';
        }
        $scope.countColls = function() {
            $scope.showLoading = true;
            $http.get('/dbconsole/countColl')
                .then(function onSuccess(data) {
                console.log(data);
                $scope.results = data.data;
                $scope.showLoading = false;

            })
        }
        $scope.convertRecipes = (() => {
            $http.get('/dbconsole/convertRecipes')
                .then(function onSuccess(data) {
                    $scope.error = 'success';
                })
        })

        $scope.countCollection = function() {
            $http.get('/dbconsole/restoreColl')
            .then(function onSuccess(data) {
                console.log(data);
            })
        }

        $scope.fixIds = () => {
            $http.get('/dbconsole/fixIds')
                .then(function onSuccess(data) {
                    $scope.error = data;
                })
        }

        $scope.rawFind = () => {
            $http.post('/dbconsole/rawFind', {rawFind: $scope.actionToDo, collName: $scope.collViewing, limit:$scope.limiter})
                .then(function onSuccess(data) {
                    $scope.results = data.data.r;
                    $scope.showLoading = false;
                    $scope.qTime = data.data.queryTime;
                    $scope.countOfResults = data.data.count;
                })

        }


    }]);
