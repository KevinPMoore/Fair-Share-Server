'use strict';

module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'do-change-this-secret',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost/fair-share',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost/fair-share-test',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'https://fair-share-sigma.vercel.app/',
};