'use strict';

const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');

describe('Auth Endpoints', function() {
  let db;

  const testHouseholds = helpers.makeHouseholdsArray();
  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db=knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    beforeEach('insert households and users', () =>
      helpers.seedHouseholds(
        db,
        testHouseholds
      )
        .then(
          helpers.seedUsers(
            db,
            testUsers
          )
        )
    );

    const requiredFields = ['username', 'password'];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        username: testUser.username,
        password: testUser.password
      };
      
      it(`responds with a 400 error when required field '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });

    it('responds 400 \'Incorrect username or password\' when bad username is provided', () => {
      const userInvalidUser = { username: 'user-not', password: 'existy' };
      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidUser)
        .expect(400, {
          error: 'Incorrect username or password'
        });
    });

    it('repsonds 400 \'Incorrect username or password\' when bad password is provided', () => {
      const userInvalidPass = { username: testUser.username, password: 'incorrect' };
      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidPass)
        .expect(400, {
          error: 'Incorrect username or password'
        });
    });

    it('responds 200 and object with user and JWT auth token using secret when provided valid credentials', () => {
      const userValidCreds = {
        username: testUser.username,
        password: testUser.password
      };
      const expectedToken = jwt.sign(
        { userid: testUser.userid },
        process.env.JWT_SECRET,
        {
          subject: testUser.username,
          algorithm: 'HS256',
        }
      );
      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {
          user: {
            userid: testUser.userid,
            username: testUser.username,
            userhousehold: testUser.userhousehold
          },
          authToken: expectedToken
        });
    });
  });
});