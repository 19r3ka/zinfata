// dispatch.factory('Credentials', ['$resource', function($resource) {
//     return $resource('/creds/:api', {api: '@api'}, {
//         soundcloud: { method: 'GET', params: {api: 'soundcloud'} }
//     });
// }])
// .factory('Soundcloud', ['$resource', '$rootScope', 'Credentials', '$log', '$q', 'sessionStore', 
//                         function($resource, $rootScope, Creds, $log, $q, store) {
//     /*  This factory is absolutely buggy and cannot be considered complete.
//         It is probably better to include the JavaScript SDK and allow user to 
//         upload to Soundcloud through their own accounts via zinfataClient. */
//     var SC     = {},
//         SC_api = $resource('https://api.soundcloud.com/:endpoint', {endpoint: '@endpoint'}, {
//             connect: { method: 'POST', params: {endpoint: 'oauth2/token'} },
//             upload:  { method: 'POST', params: {endpoint: 'tracks'} }
//         });
//     SC.connect = function(success, failure) {
//         Creds.soundcloud(function(credentials) {
//             var creds = {
//                 client_id:     credentials.clientId,
//                 client_secret: credentials.clientSecret,
//                 grant_type:    'password',
//                 username:      credentials.username,
//                 password:      credentials.password
//             };
            
//             SC_api.connect(creds, function(response) {
//                 success(response);
//             }, function(err) {
//                 failure(err);
//             });
//         });
//     };

//     SC.upload = function(track) {
//         var payload  = {
//             title:      track.artist.handle + ' - ' + track.title,
//             asset_data: track.audioFile
//         };
//             /*deferred = $q.defer(),
//             url      = 'https://api.soundcloud.com/tracks',
//             xhr      = new XMLHttpRequest;

//             xhr.upload.onprogress = function(e) {
//                 if(e.lengthComputable) deferred.notify(Math.round(e.loaded / e.total * 100));
//             };

//             xhr.upload.onload = function(e) {
//                 var res = {
//                     data:    e.response,
//                     status:  e.status,
//                     headers: e.getResponseHeader,
//                     config:  {}
//                 };
//                 $log.debug(res.status);
//                 if(res.status === 200) {
//                     deferred.resolve(res);
//                 } else {
//                     deferred.reject(res);
//                 }
//             };

//             xhr.upload.onerror = function(e) {
//                 deferred.reject(e);
//             };

//             xhr.onreadystatechange = function() {
//                 $log.debug(xhr);
//                 $log.debug(xhr.readyState);
//                 if(xhr.readyState === 4 && xhr.status === 401) {
//                     $log.debug('we intercepted the 401');
//                     SC.connect(function(accessToken) {
//                         store.setData('SCKeys', accessToken);
                        
//                     }, function(err) {
//                         deferred.reject();
//                     });
//                 }
//             }

//             xhr.open('POST', url, true);
//             xhr.send(payload);

//             return deferred.promise;*/
//     };

//     return SC;
// }]);