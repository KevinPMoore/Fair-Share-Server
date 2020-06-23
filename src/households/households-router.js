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
//Inserts a new household into the datapase when provided a householdname
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
//pick up here

module.exports = householdsRouter;