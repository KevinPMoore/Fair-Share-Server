'use strict';

const xss = require('xss');
const bcrypt = require('bcryptjs');
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  getAllUsers(db) {
    return db
      .from('fs_users')
      .select(
        'userid',
        'username',
        'password',
        'userhousehold'
      );
  },
  getUserById(db, id) {
    return UsersService.getAllUsers(db)
      .where('userid', id)
      .first();
  },
  getUsersByHouseId(db, id) {
    console.log('getUsersByHouseId ran with id ', id);
    return UsersService.getAllUsers(db)
      .where('userhousehold', id);
  },
  hasUserWithUsername(db, username) {
    return db('fs_users')
      .where({ username })
      .first()
      .then(user => !!user);
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into('fs_users')
      .returning('*')
      .then(([user]) => user);
  },
  deleteUserById(db, userid) {
    return db('fs_users')
      .where({ userid })
      .delete();
  },
  updateUser(db, userid, newUserFields) {
    return db('fs_users')
      .where({ userid })
      .update(newUserFields);
  },
  validatePassword(password) {
    if (password.length < 8) {
      return 'Password must be longer than 8 characters';
    }
    if (password.length > 72) {
      return 'Password must be less than 72 characters';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with empty spaces';
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'Password must contain 1 upper case, lower case, number and special character';
    }
    return null; 
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  serializeUser(user) {
    return {
      userid: user.userid,
      username: xss(user.username),
      password: xss(user.password),
      userhousehold: user.userhousehold,
      administrator: user.administrator,
    };
  }
};

module.exports = UsersService;