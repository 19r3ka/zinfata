app.factory('UsersService', function(Users, Login, Logout) {
  var service = {
    create: function(user) {
      var new_user = new Users;
      for(var key in user) {
        new_user[key] = user[key];
      }
      new_user.$save(function() {
        users = getUsers();
        users.push(new_user);
        setUsers(users);
      });
      return new_user;
    },
    login: function(user) {
      return Login(user);
    },
    logout: function() {
      // return Logout();
    }
  };
  return service;
});
