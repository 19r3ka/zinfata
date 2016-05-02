app.controller('messageCtrl', ['$scope', 'MessageSvc', '$log', '$timeout',
function($scope, MessageSvc, $log, timeout) {
  var e = angular.element('.alert-dismissable');
  $scope.icon    = function() {
    return ($scope.message().type === 'success') ?
        'fa fa-check' : 'fa fa-exclamation';
  };
  $scope.$watch(function() {
    return MessageSvc.getMsg();
  },function(newVal, oldVal) {
    e.show();
    $scope.message = newVal;
    $scope.icon = ($scope.message && $scope.message.type === 'success') ?
    'fa fa-check' : 'fa fa-exclamation';
    timeout(function() {
      e.alert('close');
    }, 3000);
  });

  /*Must prevent Bootstrap from destroying the alert to be reused */
  e.on('close.bs.alert', function() {
    e.hide();
    return false; // prevents element from DOM removal
  });
}]);
