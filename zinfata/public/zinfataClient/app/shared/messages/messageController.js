app.controller('messageCtrl', ['$scope', 'MessageSvc', function($scope, MessageSvc) {
  $scope.messages = MessageSvc.messages;
  MessageSvc.clearQueue();
}]);
