app.controller('messageCtrl', ['$scope', 'MessageSvc', '$log',
function($scope, MessageSvc, $log) {
  $scope.$watch(function() {
    return MessageSvc.getMsg();
  }, function(newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.message = MessageSvc.getMsg();
      $scope.icon    = ($scope.message.type === 'success') ?
      'fa fa-check' : 'fa fa-exclamation';
    }
  });
}]);
