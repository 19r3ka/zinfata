var nodemailer = require('nodemailer');

function ZinfataMailerService(mailConfig) {

  if (!(this instanceof ZinfataMailerService)) throw new Error('ZinfataMailerService needs to be called with the new keyword');

  this.mailConfig = mailConfig;
  this.htmlStart = '<html> <head>  <meta charset="utf-8"/>  <title></title>	  <style>  *{box-sizing: border-box}  html,body{background-color: #F5F5F5;}  #header{ background-color: #F5F5F5; text-align: center; padding-top: 20px;  }  #welcome{ padding: 15px 10px; font-size: 20px; color: #000000; }  #header, #welcome{ background-color: #F5F5F5;  }  #logo img{max-height: 100px;width:auto;}  #content{ width: 70%;	margin: 0 auto; background-color : #FFFFFF; padding-left: 15px; padding-right: 15px; padding-bottom: 15px; padding-top: 20px;  }  p{font-size: 0.9em; color: #424242; font-family: arial;}  #footer{ height: 100px; /*background-color: #212121;*/ text-align: center; padding : 10px; padding-top : 30px; }  #copyright{ color: #424242; display: inline-block; font-size: 0.8125em;   }  </style> </head> <body>  <div id="header"> <div id="logo"><img alt="logo" src="http://res.cloudinary.com/dqncfa7aa/image/upload/v1454627461/zlogoBlack_nrzlca.png"/></div> ';
  this.welcome = '<div id="welcome">Welcome to Zinfata, your official music dealer!</div>';
  this.resetPassword = '<div id="welcome">Password reset</div>';
  this.htmlStartRest = '</div> <div id="content">';
  this.htmlEnd = '</div><div id="footer">  <div id="copyright">Copyright &copy; ' + (new Date()).getFullYear() + ' Zinfata Inc. All right reserved</div>  </div> </body> </html>';
  this.transporter = nodemailer.createTransport({
    service: this.mailConfig.service,
    auth: mailConfig.auth
  });
  var Styliner = require('styliner');
  this.styliner = new Styliner();

};

//---------------

ZinfataMailerService.prototype.sendWelcomeMail = function(to, username, activationLink, callback) {
  var self = this;

  var content =
	'<p>Hi ' + username + '!</p>' +

  '<p>Welcome to Zinfata! Thanks so much for joining us. You are now just one click away from the music: all the music!</p>' +

  '<p>Zinfata is the first music locker and streaming app dedicated exclusively to Togolese music.</p>' +

  '<p>Find, listen, like your favorite songs or discover brand new ones, all in one place: from within Zinfata.</p>' +

  '<p>All you have to do to activate your Zinfata account is to validate your email right now by clicking on the link below or copy/pasting it into your favorite browser.</p>' +

  '<p> ' + activationLink + '</p> ' +

  '<p>Have any questions? Just shoot us an email! We’re always here to help.</p>' +

  '<p>Cheerfully yours,</p>' +
  '<p>The Zinfata Team</p>';
  content = this.htmlStart + this.welcome + this.htmlStartRest + content + this.htmlEnd;
  var mailOptions = {
    from: this.mailConfig.auth.user,
    to: to,
    subject: 'Welcome to Zinfata, your official music dealer!',
    //html: content
  };

  this.styliner.processHTML(content).then(function(processedSource) {
    mailOptions.html = processedSource;
    self.sendMail(mailOptions, callback);
  });

};

/**
*@to the destinator email address
**/

ZinfataMailerService.prototype.sendPasswordRecoveryMail = function(to, username, recoveryLink, callback) {

  /*
  	create route for password recovery ex: localhost:3000/users/recovery/:token
  	-generate token
  	-send it to user by mail i.e tell him to click on localhost:3000/users/recovery/:token or localhost:3000/users/revoke/:token/ if he doesn't request any paasword recovery
  	-if mail is send successfully => deactivate account, associate the token with that user.

  	if user click on ocalhost:3000/users/recovery/:token
  	-find user associate to the token
  	-show page with fields to set the new password (create a route for that)
  	-after redirect him to login
  	-send him a mail to tell him that the new password was st successfully

  	*/
  var self = this;

  var content =
	'<p>Hi ' + username + ',</p>' +

  '<p>To reset your Zinfata password, simply click on the link below:</p>' +

  '<p>[insert one-time-recovery-password here]</p>' +

  '<p>If you didn\'t request a password reset, simply ignore this email, somebody probably typed in your email by mistake. </p>' +

  '<p>Have questions? Don\'t hesitate to shoot us an email at any time.</p>' +

  '<p>Cheerfully,</p>' +

  '<p>The Zinfata Team</p>' ;

  content = this.htmlStart + this.resetPassword + this.htmlStartRest + content + this.htmlEnd;

  var mailOptions = {
    from: this.mailConfig.auth.user,
    to: to,
    subject: 'Reset your Zinfata Password Now!',
  };
  //this.sendMail(mailOptions, callback);
  this.styliner.processHTML(content).then(function(processedSource) {
    mailOptions.html = processedSource;
    self.sendMail(mailOptions, callback);
  });
};

ZinfataMailerService.prototype.sendMail = function(mailOptions, callback) {
  this.transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log('ERROR when trying to send mail to : ' + mailOptions.to);
      callback(error);
    } else {
      console.log('Mail send to : ' + mailOptions.to + ' successfully');
      callback(error, info);
    }
  });
};

module.exports = ZinfataMailerService;
