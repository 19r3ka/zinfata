app.controller('messageCtrl', ['$scope', 'messageSvc', function($scope, messageSvc) {
  $scope.messages = messageSvc.messages;
  messageSvc.clearQueue();
}]);
