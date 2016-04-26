app.controller('messageCtrl', ['$scope', 'MessageSvc', '$log', '$timeout',
function($scope, MessageSvc, $log, timeout) {
  var e = angular.element('.alert-dismissable');
  $scope.$watch(function() {
    return MessageSvc.getMsg();
  }, function(newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.message = MessageSvc.getMsg();
      $scope.icon    = ($scope.message.type === 'success') ?
      'fa fa-check' : 'fa fa-exclamation';
      timeout(function() {
        e.alert('close');
      }, 2000);
    }
  });
}]);
