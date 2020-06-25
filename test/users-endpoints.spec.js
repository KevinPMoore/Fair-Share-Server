'use strict';
const knex = require('knex');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');
const { expect } = require('chai');

describe('Users Endpoints', function() {
  let db;

  const testHouseholds = helpers.makeHouseholdsArray();
  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
    
  before('cleanup', () => helpers.cleanTables(db));
        
  afterEach('cleanup', () => helpers.cleanTables(db));
    
  describe('GET /api/users', () => {
    context('Given no users', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200, []);
      });
    });

    context('Given there are users', () => {
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
      return supertest(app)
        .get('/api/users')
        .expect(200)
        .expect((res => {
          let allPasswordsMatch = res.body.every((user, index) => {
            return bcrypt.compareSync(testUsers[index].password, user.password);
          });
          expect(allPasswordsMatch).to.eql(true);
          expect(res.body.length).to.eql(testUsers.length);
        }));
    });

    context('Given an XSS attack user', () => {
      const {
        maliciousUser,
        expectedUser,
      } = helpers.makeMaliciousUser();

      beforeEach('insert malicious user', () => 
        helpers.seedMaliciousUser(db, maliciousUser)
      );

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/users')
          .expect(200)
          .expect(res => {
            expect(res.body[0].username).to.eql(expectedUser.username);
            expect(bcrypt.compareSync(maliciousUser.password, res.body[0].password)).to.be.true;
          });
      });
    });
  });

  describe('GET /api/users/:userid', () => {
    context('Given no users', () => {
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
      it('responds with 404', () => {
        const badUserId = 1234567;
        return supertest(app)
          .get(`/api/users/${badUserId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'User does not exist'
          });
      });
    });

    context('Given there are users', () => {
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
      it('responds with 200 and the specified user', () => {
        const userId = 2;
        const expectedUser = testUsers[userId - 1];
        return supertest(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', helpers.makeAuthHeader(expectedUser))
          .expect(200)
          .expect(res => {
            expect(res.body.userid).to.eql(expectedUser.userid);
            expect(res.body.username).to.eql(expectedUser.username);
            expect(res.body.userhousehold).to.eql(expectedUser.userhousehold);
            expect(bcrypt.compareSync(expectedUser.password, res.body.password)).to.be.true;
          });
      });
    });

    context('Given an XSS attack user', () => {
      const { maliciousUser, expectedUser } = helpers.makeMaliciousUser();
      beforeEach('insert malicious user', () => 
        helpers.seedMaliciousUser(db, maliciousUser)
      );
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/users/${maliciousUser.userid}`)
          .set('Authorization', helpers.makeAuthHeader(maliciousUser))
          .expect(200)
          .expect(res => {
            expect(res.body.user_name).to.eql(expectedUser.user_name);
            expect(bcrypt.compareSync(maliciousUser.password, res.body.password)).to.be.true;
          });
      });
    });
  });

  describe('POST /api/users', () => {
    context('User validation', () => {
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
      const requiredFields = [ 'username', 'password'];

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          username: 'test username',
          password: 'test password',
        };

        it(`responds with 400 error when '${field}' is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`
            });
        });
      });

      it('responds 400 \'Password must be longer than 8 characters\' when empty password', () => {
        const userShortPassword = {
          username: 'test username',
          password: '1234567'
        };
        return supertest(app)
          .post('/api/users')
          .send(userShortPassword)
          .sexpect(400, {
            error: 'Password must be longer than 8 characters'
          });
      });

      it('responds 400 \'Password must be less than 72 characters\' when long password', () => {
        const userLongPassword = {
          username: 'test username',
          password: '*'.repeat(73),
        };
        return supertest(app)
          .post('/api/users')
          .send(userLongPassword)
          .expect(400, {
            error: 'Password must be less than 72 characters'
          });
      });

      it('responds 400 error when password starts with spaces', () => {
        const userPasswordStartsSpaces = {
          username: 'test username',
          password: ' 1Aa!2Bb@',
        };
        return supertest(app)
          .post('/api/users')
          .send(userPasswordStartsSpaces)
          .expect(400, {
            error: 'Password must not start or end with empty spaces'
          });
      });

      it('responds 400 error when password ends with spaces', () => {
        const userPasswordEndsSpaces = {
          username: 'test username',
          password: '1Aa!2Bb@ ',
        };
        return supertest(app)
          .post('/api/users')
          .send(userPasswordEndsSpaces)
          .sexpect(400, {
            error: 'Password must not start or end with empty spaces'
          });
      });

      it('responds 400 error when password isn\'t complex enough', () => {
        const userPasswordNotComplex = {
          username: 'test username',
          password: '11AAaabb',
        };
        return supertest(app)
          .post('/api/users')
          .send(userPasswordNotComplex)
          .expect(400, { 
            error: 'Password must contain 1 upper case, lower case, number and special character' 
          });
      });

      it('responds 400 \'User name already taken\' when user_name isn\'t unique', () => {
        const duplicateUser = {
          user_name: testUser.user_name,
          password: '11AAaa!!',
        };
        return supertest(app)
          .post('/api/users')
          .send(duplicateUser)
          .expect(400, { 
            error: 'Username already taken' 
          });
      });

      context('Happy path', () => {
        it('responds 201, serialized user, and stores bcrypted password', () => {
          const newUser = {
            username: 'test username',
            password: '11AAaa!!',
          };
          return supertest(app)
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect(res => {
              expect(res.body).to.have.property('userid');
              expect(res.body.username).to.eql(newUser.username);
              expect(res.body.password).to.not.have.property(newUser.password);
            })
            .expect(res => {
              db
                .from('fs_users')
                .select('*')
                .where({ userid: res.body.userid })
                .first()
                .then(row => {
                  expect(row.username).to.eql(newUser.username);
                  expect(row.userhousehold).to.eql(newUser.userhousehold);
                  return bcrypt.compare(newUser.password, row.password);
                })
                .then(compareMatch => {
                  expect(compareMatch).to.be.true;
                });
            });
        });
      });
    });
  });

  describe('Delete /api/users/:userid', () => {
    context('Given no users', () => {
      it('responds with 401 because the auth token cannot match', () => {
        const badUserId = 1234567;
        return supertest(app)
          .delete(`/api/users/${badUserId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(401, {
            error: 'Unauthorized request'
          });
      });
    });

    context('Given there are users in the database', () => {
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
      
      it('responds 204 and removes the user', () => {
        const idToRemove = 2;
        const expectedUsers = testUsers.filter(user => user.userid !== idToRemove);
        return supertest(app)
          .delete(`/api/users/${idToRemove}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(204)
          .then(res => {
            supertest(app)
              .get('/api/users')
              .expect(expectedUsers);
          });
      });
    });
  });

  describe('PATCH /api/users/:userid', () => {
    context('Given no users', () => {
      it('responds with 401 because an auth token cannot match', () => {
        const badUserId = 1234567;
        return supertest(app)
          .delete(`/api/users/${badUserId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(401, {
            error: 'Unauthorized request'
          });
      });
    });

    context('Given there are users in the database', () => {
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

      it('responds with 204 and updates the user', () => {
        const idToUpdate = 2;
        const updatedUser = {
          username: 'NewUserName',
          password: 'N3wPassword!',
          userhousehold: 2
        };
        const expectedUser = {
          //...testUsers[idToUpdate - 1],
          //...updatedUser
        };
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[1]))
          .send(updatedUser)
          .expect(204)
          .then(res => {
            expect(res.body.userid).to.eql(expectedUser.userid);
            expect(res.body.username).to.eql(expectedUser.username);
            expect(res.body.userhousehold).to.eql(expectedUser.userhousehold);
          });
      });

      it('responds with 400 when non-required fields are supplied', () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({ irrelivantField: 'foo' })
          .expect(400, {
            error: {
              message: 'Request body must contain \'username\' and \'userhousehold\''
            }
          });
      });

      it('responds with 204 when updating only a subset of fields', () => {
        const idToUpdate = 2;
        const updatedUser = {
          username: 'NewUserName',
          password: 'N3wPassword!',
          userhousehold: 2
        };
        const expectedUser = {
          ...testUsers[idToUpdate - 1],
          ...updatedUser
        };

        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({
            ...updatedUser,
            fieldToIgnore: 'should not be in the GET response'
          })
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/users/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(res => {
                expect(res.body.userid).to.eql(expectedUser.userid);
                expect(res.body.username).to.eql(expectedUser.username);
                expect(res.body.userhousehold).to.eql(expectedUser.userhousehold);
              });
          });
      });
    });
  });
});