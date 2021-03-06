'use strict';

const express = require('express');
const path = require('path');
const HouseholdsService = require('./households-service');
const UsersService = require('../users/users-service');
const ChoresService = require('../chores/chores-service');
const { serializeHousehold } = require('./households-service');
const { requireAuth } = require('../middleware/jwt-auth');

const householdsRouter = express.Router();
const jsonBodyParser = express.json();

householdsRouter
  .route('/')
  //Provides a list of all households
  .all(requireAuth)
  .get((req, res, next) => {
    HouseholdsService.getAllHouseholds(req.app.get('db'))
      .then(households => {
        res.json(households.map(house => HouseholdsService.serializeHousehold(house)));
      })
      .catch(next);
  })
//Inserts a new household into the database when provided a householdname
//The id is populated by default
//Household names are allowed to be non-unique since id allows for differentiation
  .post(jsonBodyParser, (req, res, next) => {
    const { householdname } = req.body;
    const newHousehold = { householdname };
    for(const field of ['householdname'])
      if(!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });
    //Inserts the new household and returns the household object
    HouseholdsService.insertHousehold(
      req.app.get('db'),
      newHousehold
    )
      .then(household => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${household.householdid}`))
          .json(serializeHousehold(household));
      })
      .catch(next);
  });

//These are protected endpoints that require authorization to access
householdsRouter
  .route('/:householdid')
  .all(requireAuth)
  .all(checkHouseholdExists)
  .get((req, res) => {
    res.json(HouseholdsService.serializeHousehold(res.household));
  })
  //Removes the specified household based on request params and sends a 204
  .delete((req, res, next) => {
    HouseholdsService.deleteHouseById(
      req.app.get('db'),
      req.params.householdid
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  //Allows for updating of householdname, though currently this is not used by the client
  .patch(jsonBodyParser, (req, res, next) => {
    const { householdname } = req.body;
    const householdToUpdate = { householdname };
    const expectedKeys = ['householdname'];

    //Checks that appropriate fields are provided
    for (let i = 0; i < expectedKeys.length; i ++) {
      if(!householdToUpdate.hasOwnProperty(expectedKeys[i])) {
        return res.status(400).json({
          error: `Request body must contain '${expectedKeys}'`
        });
      }
    }

    const numberOfValues = Object.values(householdToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: 'Request body must contain \'householdname\''
      });

    //Sends PATCH request with new household information and returns a 204
    const updatedHousehold = { householdname: householdToUpdate.householdname };
    HouseholdsService.updateHousehold(
      req.app.get('db'),
      req.params.householdid,
      updatedHousehold
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

//Used to get users with a userid that matches householdid
householdsRouter
  .route('/:householdid/users')
  .all(requireAuth)
  .all(checkHouseholdExists)
  .get((req, res, next) => {
    UsersService.getUsersByHouseId(
      req.app.get('db'),
      res.household.householdid
    )
      .then(users => {
        res.json(users.map(user => UsersService.serializeUser(user)));
      })
      .catch(next);
  });

//Used to get chores with a choreid that matches householdid
householdsRouter
  .route('/:householdid/chores')
  .all(requireAuth)
  .all(checkHouseholdExists)
  .get((req, res, next) => {
    ChoresService.getChoreByChoresHouseholdId(
      req.app.get('db'),
      res.household.householdid
    )
      .then(chores => {
        res.json(chores.map(chore => ChoresService.serializeChore(chore)));
      })
      .catch(next);
  });

//Confirms that a household with the id in the request params is in the database
async function checkHouseholdExists (req, res, next) {
    try {
      const household = await HouseholdsService.getHouseholdById(
        req.app.get('db'),
        req.params.householdid
      );
      if(!household)
        return res.status(404).json({
          error: 'Household does not exist'
        });
  
      res.household = household;
      next();
    } catch (error) {
      next(error);
    }
  };

module.exports = householdsRouter;