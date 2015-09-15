app.service('UsersSvc', ['Users', 'Auth', 'MessageSvc', function(Users, Auth, MessageSvc) {
  this.users  = []
  this.create = function(user) {
    var new_user = new Users;
    for(var key in user) {
      new_user[key] = user[key];
    }
    new_user.$save(function(saved_user) {
      // this.users = getUsers();
      // this.users.push(saved_user);
      // setUsers(users);
      MessageSvc.addMsg('success', 'Welcome to Zinfata, ' + saved_user.firstName | uppercase);
    },
    function(error) {
      console.error('Unable to save user: ' + error);
      MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };
  this.login = function(user) {
    return Auth.login(user);
  };
  this.logout = function() {
    // return Auth.logout();
  };
}]);
