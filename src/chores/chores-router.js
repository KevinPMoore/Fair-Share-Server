'use strict';

const express = require('express');
const path = require('path');
const ChoresService = require('./chores-service');
const { serializeChore } = require('./chores-service');
const { requireAuth } = require('../middleware/jwt-auth');

const choresRouter = express.Router();
const jsonBodyParser = express.json();

choresRouter
  .route('/')
  //Provides a list of all chores
  .all(requireAuth)
  .get((req, res, next) => {
    ChoresService.getAllChores(req.app.get('db'))
      .then(chores => {
        res.json(chores.map(chore => ChoresService.serializeChore(chore)));
      })
      .catch(next);
  })
//Inserts a new chore into the database when provided with a chorename
//The id is generated by default while the choreuser is null by default
  .post(jsonBodyParser, (req, res, next) => {
    const { chorename, chorehousehold } = req.body;
    const newChore = { chorename, chorehousehold };
    for(const field of ['chorename', 'chorehousehold'])
      if(!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });
    //Inserts the new chore and returns the chore object
    ChoresService.insertChore(
      req.app.get('db'),
      newChore
    )
      .then(chore => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${chore.choreid}`))
          .json(serializeChore(chore));
      })
      .catch(next);
  });

//These are protected endpoints that require authorization to access
choresRouter
  .route('/:choreid')
  .all(requireAuth)
  .all(checkChoreExists)
  .get((req, res) => {
    res.json(ChoresService.serializeChore(res.chore));
  })
//Removes the specified chore based on request params and sends a 204 
  .delete((req, res, next) => {
    ChoresService.deleteChoreById(
      req.app.get('db'),
      req.params.choreid
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
//Updates chore fields, primarily 'chorehousehold' and 'choreuser'
  .patch(jsonBodyParser, (req, res, next) => {
    const { chorename, chorehousehold, choreuser } = req.body;
    const choreToUpdate = { chorename, chorehousehold, choreuser };
    const expectedKeys = ['chorename', 'chorehousehold', 'choreuser'];

    //Checks that appropriate fields are provided
    for (let i = 0; i < expectedKeys.length; i ++) {
      if(!choreToUpdate.hasOwnProperty(expectedKeys[i])) {
        return res.status(400).json({
          error: `Request body must contain '${expectedKeys}'`
        });
      }
    }

    const numberOfValues = Object.values(choreToUpdate).filter(Boolean).length;
    if(numberOfValues === 0) {
      return res.status(400).json({
        error: 'Request body must contain \'chorename\', \'chorehousehold\'and \'choreuser\''
      });
    }
    //Sends PATCH request with new chore information and returns a 204
    const updatedChore = { chorename: choreToUpdate.chorename, chorehousehold: choreToUpdate.chorehousehold, choreuser: choreToUpdate.choreuser};
    ChoresService.updateChore(
      req.app.get('db'),
      req.params.choreid,
      updatedChore
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });


//Confirms that a chore with the id in the request params is in the database
async function checkChoreExists (req, res, next) {
    try {
      const chore = await ChoresService.getChoreById(
        req.app.get('db'),
        req.params.choreid
      );
      if(!chore)
        return res.status(404).json({
          error: 'Chore does not exist'
        });
  
      res.chore = chore;
      next();
    } catch (error) {
      next(error);
    }
  };
module.exports = choresRouter;