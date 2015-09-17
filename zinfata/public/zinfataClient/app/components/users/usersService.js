app.service('UsersSvc', ['Users', 'Auth', 'MessageSvc', function(Users, Auth, MessageSvc) {
  this.users    = Users.query();
  this.loggedIn = false;

  this.create = function(user) {
    var new_user = new Users;
    for(var key in user) {
      new_user[key] = user[key];
    }
    new_user.$save(function(saved_user) {
      // this.users = getUsers();
      // this.users.push(saved_user);
      // setUsers(users);
      MessageSvc.addMsg('success', 'Welcome to Zinfata, ' + saved_user.firstName);
    }, function(error) {
      console.error('Unable to save user: ' + error);
      MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };

  this.login = function(user) {
    Auth.login(user).then(function(data) {
      alert('Logged user in!');
      MessageSvc.addMsg('success', 'You are now logged in as ');
    }, function(error) {
      console.error('Unable to log user in: ' + error);
      MessageSvc.addMsg('danger', 'We were unable to log you in!');
    });
  };

  this.logout = function() {
    return Auth.logout();
  };

  this.currentUser = function() {
    Auth.currentUser.then(function(user) {
      this.loggedIn = true;
      return user;
    }, function(error) {
      return {
        firstName: 'guest',
        lastName: 'user',
        handle: 'guestuser'
      };
    });
  };
}]);
