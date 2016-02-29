app.filter('duration2time', function() {
   return function(duration) {
        duration = parseInt(duration);
        if(!angular.isNumber(duration)) duration = 0; 
        var minutes = '0' + Math.floor(duration / 60),
            seconds = '0' + Math.floor(duration) % 60;
        return minutes.substr(-2) + ':' + seconds.substr(-2);
   };
});