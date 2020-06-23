  
'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const AuthService = {
  //Fetches a specific user based on the id provided
  getUserWithId(db, userid) {
    return db('fs_users')
      .where({ userid })
      .first();
  },
  //Fetches a specific user based on the user_name provided, used for login
  getUserWithUserName(db, username) {
    return db('fs_users')
      .where({ username })
      .first();
  },
  //Determines if a password string equals the hashed string in the database.  Returns a boolean value
  comparePasswords(password, hash) {
    return bcrypt.compare(password, hash);
  },
  //Creates a JWT and returns it in the payload
  createJwt(subject, payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      algorithm: 'HS256',
    });
  },
  //Checks the provided token against the JWT_SECRET
  verifyJwt(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  },
  //Splits the string of the provided token at the ':'
  parseBasicToken(token) {
    return Buffer
      .from(token, 'base64')
      .toString()
      .split(':');
  }
};

module.exports = AuthService;