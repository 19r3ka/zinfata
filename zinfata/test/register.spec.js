describe('registerController', function() {

    var userSvc, $controller;
    beforeEach(module('zinfataClient'));
    beforeEach(inject(function(_UsersSvc_, _$controller_, _$httpBackend_) {
        userSvc      = _UsersSvc_;
        $controller  = _$controller_;
        $httpBackend = _$httpBackend_;

    }));
    // beforeEach(module(inject(function($provide) {

    // })));
    var $scope, controller;

    beforeEach(function() {
        $scope      = {};
        controller  = $controller('registerCtrl', {$scope : $scope});
    });

    describe('creating a new user', function() {
        it('populates $scope.user before registration', function() {
            $scope.user = {
                firstName: 'sonia',
                lastName:  'suarez',
                handle:    'sosu',
                email:     'marielsuaren@gmail.com',
                password:  'whatever'  
            }

            $scope.user.should.have.property('firstName').which.equals('sonia');
        });

        it('creates a new_user via the userSvc service', function() {
            $httpBackend
            .expectPOST('/api/users', {
                firstName: 'sonia',
                lastName:  'suarez',
                handle:    'sosu',
                email:     'marielsuaren@gmail.com',
                password:  'whatever' 
            })
            .respond(201)

            userSvc.create($scope.user, function(res){
                res.should.have.status(201);
                res.body.should.have.property('firstName', 'sonia');
                res.body.should.have.property('password', null);
            }, function(err){

            })
        })


    })
});