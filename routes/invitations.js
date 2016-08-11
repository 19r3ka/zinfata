module.exports = function(wagner) {
  var router = require('express').Router();

  wagner.invoke(function(Invitation, ZError, mailService, PasswordToken) {
    router
      .route('/')
        .get(function(req, res, next) {
          Invitation.find(function(err, invitations) {
            if (err) {
              return next(err);
            }
            res.json(invitations);
          });
        })
        .post(function(req, res, next) {
          var invitation = new Invitation({
            contact: req.body.contact,
            medium:  req.body.medium
          });
          invitation.save(function(err, newInvit) {
            if (err) {
              return next(err);
            }

            res.status(201).json(newInvit);
          });
        });
    router
      .route('/validate')
        .get(function(req, res, next) {
          var query = {};

          if (!!req.query.vc) { // it's a verification cookie
            query.cookie =  req.query.vc;
          } else if (!!req.query.ic) { // there's an invitation code instead
            query.code =    req.query.ic;
          }

          Invitation.findOne(query, function(err, invitation) {
            if (err) {
              return next(err);
            }

            if (!invitation) {
              return next(new ZError('not_found', 'Not a valid invitation code.'));
            }

            if (query.cookie) {
              // Since we are just verifying a verification cookie
              // Return after sending back the corresponding invitation
              return res.json(invitation)
            }

            // Otherwise, go ahead and send an invitation object with a verification cookie
            PasswordToken.generateToken(function(cookie) {
              invitation.cookie = cookie;
              invitation.accepted = true;
              invitation.save(function(err, newInvitation) {
                res.json(newInvitation);
              });
            });
          });
        });
    router
      .route('/:id')
        .get(function(req, res, next) {
          Invitation.findById(req.params.id, function(err, invitation) {
            if (err) {
              return next(err);
            }

            if (!invitation) {
              return next(new ZError('not_found', 'Not a valid invitation code.'));
            }

            res.json(invitation);
          });
        })
        .put(function(req, res, next) {
          Invitation.findById(req.params.id, function(err, invitation) {
            if (err) {
              return next(err);
            }

            if (!invitation) {
              return next(new ZError('not_found', 'Not a valid invitation code.'));
            }

            invitation.contact = req.body.contact;
            invitation.medium  = req.body.medium;

            invitation.save(function(err, updatedInvit) {
              if (err) {
                return next(err);
              }

              res.json(updatedInvit);
            });
          });
        })
        .delete(function(req, res, next) {
          Invitation.findOneAndRemove({_id: req.params.id}, function(err, deletedInvit) {
            if (err) {
              return next(err);
            }

            res.json(deletedInvit);
          });
        });
    router
      .route('/:id/send')
        .get(function(req, res, next) {
          Invitation.findById(req.params.id, function(err, invit) {
            if (err) {
              return next(err);
            }

            if (!invit) {
              return next(new ZError('not_found', 'Not a valid invitation code.'));
            }

            var mailOptions = {
              from: mailService.mailConfig.auth.user,
              to:   invit.contact,
              subject:  'We want you to join Zinfata Now!',
            };
            var zInvitationUrl = req.get('host') + '?t=' + invit.code;
            var content = '<p> Salut, <p>' +
            '<p> Voici un code d\'invitation speciale a joindre la revolution ' +
            'musicale au Togo: <b>' + invit.code + '</b>.</p>' +
            '<p>Comment l\'utiliser? Entre le au moment de t\'enregistrer sur Zinfata (Register).' +
            ' ou simplement, clique sur le lien ci-dessous: </p>' +
            '<p>' + zInvitationUrl + '</p>';
            mailService.styliner.processHTML(content).then(function(processedSource) {
              mailOptions.html = processedSource;
              mailService.sendMail(mailOptions, function(err, info) {
                if (err) {
                  console.error('Could not send the email:' + err);
                  return next(err);
                }

                if (!info) {
                  console.error('Invitation email sent but no info? WTF???');
                  return next(new ZError('internal_error', 'No information about sent email.'));
                }
                invit.codeSent = true;
                invit.save(function(err, newInvitation) {
                  if (err) {
                    return next(err);
                  }
                  res.status(200).json(newInvitation);
                });
              });
            });
          });
        });
  });
  return router;
};
