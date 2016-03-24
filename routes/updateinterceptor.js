/**
	This module intercepts http request of type  put(update) and delete 
	checks if the ressource(album, track and playlist) to delete or delete is belong to the current logged-in user
	if the ressource doesn't belong to the logged-in user a http response with status code 403 (Forbidden) is return.
**/
module.exports = function(wagner){
	function checkAccess(loggedUserId, ownerId, route, method, next) {
		var route = route.substr(0, route.length -1)  //stripped the "s" at the end of the root
		wagner.invoke(function(ZError){
			if ( String(loggedUserId) == String(ownerId)){ //id match
	          console.log(route + ' ' + method + ' access granted ');
	          return next();
	        } else {
	    		console.log(route + ' ' + method + ' access denied ');
	        	return next(new ZError('forbidden', 'Your are not the album owner. Only the ' + route + ' owner can ' + method + ' it'));
	        }
		});
	}

	return function(req, res, next) {
			var method = req.method.toLowerCase();
			if (!method.match(/(put|delete)/i)){
				return next();
			} 
			if ( method == 'put') {
			 method = 'update';
			};
			if (req.params.id && parseInt(req.params.id) != 0) {
				var bearer = req.get('Authorization').match(/bearer\s+([0-9a-f]+)/i)[1]; //access token
				var route = req.params.route;
				var id = req.params.id;

				if (bearer){
					wagner.invoke(function(OAuthAccessToken, User, Album, Track, Playlist, ZError){      
				    OAuthAccessToken.getAccessToken(bearer, function(err, accessToken){
				        if (err){
				          return next(err);
				        }
				        if (!accessToken){
				          return next(new ZError('bad_param','Invalid acesstoken'));
				        }
				        var loggedUserId = accessToken.userId;				        
				        User.findById(accessToken.userId, function(err, user){
				          if (err){
				            return next(err);
				          }
				          if (!user){
				            //error user
				            return next(new ZError('bad_param','The current acesstoken owner was not found'));
				          }
				          var ownerId;
				          switch(route){
				            case 'albums':
				              Album.findById(id, function (err, album){
				                if (err) {
				                  return next(err);
				                }
				                if (!album){
				                  return next(new ZError('not_found','The album to ' + method + ' was not found'));
				                }
				                ownerId = album.artistId; 
				                console.log('owner '+ownerId + ' logUser ' + loggedUserId);  
				                checkAccess(loggedUserId, ownerId, route, method, next);
				              });
				              break;
				            case 'tracks':
				              Track.findById(id, function (err, track){
				                if (err) {
				                  return next(err);
				                }
				                if (!track){
				                  return next(new ZError('not_found', 'The track to ' + method + ' was not found'));
				                }
				                ownerId = track.artistId;
				                checkAccess(loggedUserId, ownerId, route, method, next);
				              })
				              break;
				            case 'playlists':
				              Playlist.findById(id, function (err, playlist){
				                if (err) {
				                  return next(err);
				                }
				                if (!playlist) {
				                  return next(new ZError('not_found', 'The playlist to ' + method + ' was not found'));
				                }
				                ownerId = playlist.ownerId;
				                checkAccess(loggedUserId, ownerId, route, method, next);

				              });
				              break;
				            case 'users':
				            console.log('in user');
				              User.findById(id, function (err, user){
				                if (err) {
				                  return next(err);
				                }
				                if (!user) {
				                  return next(new ZError('not_found', 'The user  to ' + method + ' was not found'));
				                }
				                ownerId = user._id;
				                checkAccess(loggedUserId, ownerId, route, method, next);
				              });
				              break;
				            default:
				            	return next();
				            	break;
				          }  				        
				        });				        
				      });				      
				    });
				} else {
					return next();
				}

			}
		}

}