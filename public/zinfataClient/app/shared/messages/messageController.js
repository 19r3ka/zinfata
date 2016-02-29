app.controller('messageCtrl', ['$scope', 'MessageSvc', function($scope, MessageSvc) {
  $scope.$watch(function() {
    return MessageSvc.getMsg();
  }, function(newVal, oldVal) {
    if(newVal !== oldVal) {
        $scope.message = MessageSvc.getMsg();
    }
  })
}]);
