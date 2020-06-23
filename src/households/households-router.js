'use strict';

const express = require('express');
const path = require('path');
const HouseholdsService = require('./households-service');
const { serializeHousehold } = require('./households-service');
//requireauth

const householdsRouter = express.Router();
const jsonBodyParser = express.json();

householdsRouter
  .route('/')
//Provides a list of all households
  .get((req, res, next) => {
    HouseholdsService.getAllHouseholds(req.app.get('db'))
      .then(households => {
        res.json(households.map(house => HouseholdsService.serializeHousehold(house)));
      })
      .catch(next);
  })
//Inserts a new household into the database when provided a householdname
//The id is populated by default
  .post(jsonBodyParser, (req, res, next) => {
    const { householdname } = req.body;
    const newHousehold = { householdname };
    for(const field of ['householdname'])
      if(!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });
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

householdsRouter
  .route('/:householdid')
//require auth
  .all(checkHouseholdExists)
  .get((req, res) => {
    res.json(HouseholdsService.serializeHousehold(res.household));
  })
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
  .patch(jsonBodyParser, (req, res, next) => {
    const { householdname } = req.body;
    const householdToUpdate = { householdname };
    const expectedKeys = ['householdname'];

    //Checks that appropriate fields are provided
    for (let i = 0; i < expectedKeys.length; i ++) {
      if(!householdToUpdate.hasOwnProperty(expectedKeys[i])) {
        return res.status(400).json({
          error: { message: `Request body must contain '${expectedKeys}'`}
        });
      }
    }

    const numberOfValues = Object.values(householdToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must contain \'householdname\''
        }
      });

    //Sends PATCH request with new user information and returns a 204
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