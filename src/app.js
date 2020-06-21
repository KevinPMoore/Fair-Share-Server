'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());
app.use(validateBearerToken);
//put routers here

//this needs to be the last piece of middleware
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

module.exports = app;