
'use strict';

const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';
  //Confirms there is an appropriate authToken and creates a bearerToken by slicing out the first portion
  let bearerToken;
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token. You sent ' + authToken });
  } else {
    bearerToken = authToken.slice(7, authToken.length);
  }
  //Takes the verified bearerToken and compares it to the user_id, providing a 401 if there is no match
  try {
    const payload = AuthService.verifyJwt(bearerToken);
    AuthService.getUserWithId(
      req.app.get('db'),
      payload.userid
    )
      .then(user => {
        if (!user)
          return res.status(401).json({ error: 'Unauthorized request' });

        req.user = user;
        next();
      })
      .catch(err => {
        console.error(err);
        next(err);
      });
  } catch(error) {
    res.status(401).json({ error: 'Unauthorized request' });
  }
}
  
module.exports = {
  requireAuth,
};