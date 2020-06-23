'use strict';

const express = require('express');
const path = require('path');
const UsersService = require('./users-service');
//requireAuth

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter
  .route('/')
  //Provides a list of all users
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get('db'))
      .then(users => {
        res.json(users.map(user => UsersService.serializeUser(user)));
      })
      .catch(next);
  })
  //Inserts a new user into the datapase when provided a username and password
  //Other user values are populated by default or left null until changed by user actions
  .post(jsonBodyParser, (req, res, next) => {
    const { username, password } = req.body;
    for(const field of ['username', 'password'])
      if(!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });
    //Validates password before posting the user
    const passwordError = UsersService.validatePassword(password);
    if(passwordError)
      return res.status(400).json({ error: passwordError });
    //Validates that username is unique
    UsersService.hasUserWithUsername(
      req.app.get('db'),
      username
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: 'Username already taken' });
        //After validation passes, hash the password prior to insertion
        return UsersService.hashPassword(password)
          .then(hashedPassword => {
            const newUser = {
              username,
              password: hashedPassword
            };
            //Inserts the new user and returns that user object
            return UsersService.insertUser(
              req.app.get('db'),
              newUser
            )
              .then(user => {
                res
                  .status(201)
                  .location(path.posix.join(req.originalUrl, `/${user.id}`))
                  .json(UsersService.serializeUser(user));
              });
          });
      })
      .catch(next);
  });

//These are protected routes that require authorization to access
usersRouter
  .route('/:userid')
//.all(requireAuth)
  .all(checkUserExists)
  .get((req, res) => {
    res.json(UsersService.serializeUser(res.user));
  })
//Returns the specified user based on request params and sends a 204
  .delete((req, res, next) => {
    UsersService.deleteUserById(
      req.app.get('db'),
      req.params.userid
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  //Updates a users 'userhousehold' field
  .patch(jsonBodyParser, (req, res, next) => {
    const { username, userhousehold } = req.body;
    const userToUpdate = { username, userhousehold };
    const expectedKeys = ['username', 'userhousehold'];
    //Checks that appropriate fields are provided
    for (let i = 0; i < expectedKeys.length; i ++) {
      if(!userToUpdate.hasOwnProperty(expectedKeys[i])) {
        return res.status(400).json({
          error: { message: `Request body must contain '${expectedKeys}'`}
        });
      }
    }
    const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must contain \'userhousehold\''
        }
      });
    //Sends PATCH request with new user information and returns a 204
    const updatedUser = { username: userToUpdate.username, userhousehold: userToUpdate.userhousehold };
    UsersService.updateUser(
      req.app.get('db'),
      req.params.userid,
      updatedUser
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

//Confirms that a user with the id in the request params is in the database
async function checkUserExists (req, res, next) {
    try {
      const user = await UsersService.getUserById(
        req.app.get('db'),
        req.params.userid
      );
      if(!user)
        return res.status(404).json({
          error: 'User does not exist'
        });
  
      res.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };

module.exports = usersRouter;
