app.service('MessageSvc', function() {
  this.messages = [];
  this.addMsg = function(type, text) {
    var message = {
      type: type,
      text: text
    };

    this.messages.push(message);
  }
  this.clearQueue = function(){
    this.messages.length = 0;
  }
});
