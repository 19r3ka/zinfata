app.service('UsersSvc', ['Users', 'Auth', 'MessageSvc', '$log', function(Users, Auth, MessageSvc, $log) {
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
      $log.error('Unable to save user: ' + error);
      MessageSvc.addMsg('danger', 'Oops, we were unable to register you!');
    });
  };

  this.update = function(user) {
    var updatedUser = Users.get({id: user.id});
    for(var key in user) {
      if(updatedUser[key] !== user[key]) updatedUser = user[key];
    }
    updatedUser.$save(function(updatedUser) {
      MessageSvc.addMsg('success', 'Your profile has been successfully updated');
    },
    function(error) {
      $log.error('Profile update failed: ' + error);
      MessageSvc.addMsg('danger', 'Profile update failed. Try again later!');
    });
  };

  this.login = function(user) {
    Auth.login(user).then(function(loggedUser) {
      this.loggedIn = true;
      $log.debug(angular.toJson(loggedUser, true));
      MessageSvc.addMsg('success', 'You are now logged in as ' + loggedUser.data.firstName);
    }, function(error) {
      $log.error('Unable to log user in: ' + error);
      MessageSvc.addMsg('danger', 'We were unable to log you in!');
    });
  };

  this.logout = function() {
    return Auth.logout();
  };

  this.currentUser = function() {
    Auth.currentUser.then(function(user) {
      return user;
    }, function(error) {
      return {
        id: 0,
        firstName: 'guest',
        lastName: 'user',
        handle: 'guestuser'
      };
    });
  };

  this.get = function(id) {
    return Users.get({id: id});
  };
}]);
