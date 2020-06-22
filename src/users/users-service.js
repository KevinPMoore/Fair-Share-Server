'use strict';

const xss = require('xss');
const bcrypt = require('bcryptjs');
const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  getAllUsers(db) {
    return db
      .from('users')
      .select(
        'userid',
        'username',
        'userhousehold'
      );
  },
  getUserById(db, id) {
    return UsersService.getAllUsers(db)
      .where('userid', id)
      .first();
  },
  getUsersByHouseId(db, id) {
    return UsersService.getAllUsers(db)
      .where('userhousehold', id);
  },
  hasUserWithUsername(db, username) {
    return db('users')
      .where({ username })
      .first()
      .then(user => !!user);
  },
  deleteUserById(db, id) {
    return db('users')
      .where({ id })
      .delete();
  },
  updateUser(db, id, newUserFields) {
    return db('users')
      .where({ id })
      .update({ newUserFields });
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
      id: user.id,
      user_name: xss(user.user_name),
      password: xss(user.password),
      bank: user.bank,
      administrator: user.administrator,
    };
  }
};

module.exports = UsersService;