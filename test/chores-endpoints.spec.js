'use strict';
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');
const { expect } = require('chai');

describe('Chores Endpoints', function() {
  let db;

  const testHouseholds = helpers.makeHouseholdsArray();
  const testHousehold = testHouseholds[0];
  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];
  const testChores = helpers.makeChoresArray();
  const testChore = testChores[0];

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

  describe('GET /api/chores', () => {
    context('Given no chores', () => {
      beforeEach('insert households and users', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          });
      });
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/chores')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, []);
      });
    });

    context('Given there are chores', () => {
      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          });
      });
      it('responds with 200 and a list of chores', () => {
        return supertest(app)
          .get('/api/chores')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            res.body.forEach(chore => {
              expect(chore).to.have.property('chorename');
              expect(chore).to.have.property('choreid');
              expect(chore).to.have.property('choreuser');
              expect(chore).to.have.property('chorehousehold');
            });
            expect(res.body.length).to.eql(testChores.length);
          });
      });
    });

    context('Given an XSS attack chore', () => {
      const {
        maliciousChore,
        expectedChore
      } = helpers.makeMaliciousChore();

      const { maliciousHousehold } = helpers.makeMaliciousHousehold();

      const { maliciousUser } = helpers.makeMaliciousUser();

      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          })
          .then(() => {
            return helpers.seedMaliciousHousehold(
              db,
              maliciousHousehold
            );
          })
          .then(() => {
            return helpers.seedMaliciousUser(
              db,
              maliciousUser
            );
          })
          .then(() => {
            return helpers.seedMaliciousChore(
              db,
              maliciousChore
            );
          });
      });
      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/chores')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(res => {
            expect(res.body[3].chorename).to.eql(expectedChore.chorename);
            expect(res.body[3].choreid).to.eql(expectedChore.choreid);
            expect(res.body[3].choreuser).to.eql(expectedChore.choreuser);
            expect(res.body[3].chorehousehold).to.eql(expectedChore.chorehousehold);
          });
      });
    });
  });

  describe('GET /api/chores/:/choreid', () => {
    context('Given no chores', () => {
      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          });
      });
      it('responds with 404', () => {
        const badChoreId = 1234567;
        return supertest(app)
          .get(`/api/chores/${badChoreId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Chore does not exist'
          });
      });
    });

    context('Given there are chores', () => {
      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          });
      });
      it('responds with 200 and the specified chore', () => {
        const choreId = 2;
        const expectedChore = testChores[choreId - 1];
        return supertest(app)
          .get(`/api/chores/${choreId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body.choreid).to.eql(expectedChore.choreid);
            expect(res.body.chorename).to.eql(expectedChore.chorename);
            expect(res.body.choreuser).to.eql(expectedChore.choreuser);
            expect(res.body.chorehousehold).to.eql(expectedChore.chorehousehold);
          });
      });
    });

    context('Given an XSS attack chore', () => {
      const {
        maliciousChore,
        expectedChore
      } = helpers.makeMaliciousChore();

      const { maliciousHousehold } = helpers.makeMaliciousHousehold();

      const { maliciousUser } = helpers.makeMaliciousUser();

      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          })
          .then(() => {
            return helpers.seedMaliciousHousehold(
              db,
              maliciousHousehold
            );
          })
          .then(() => {
            return helpers.seedMaliciousUser(
              db,
              maliciousUser
            );
          })
          .then(() => {
            return helpers.seedMaliciousChore(
              db,
              maliciousChore
            );
          });
      });
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/chores/${maliciousChore.choreid}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body.chorename).to.eql(expectedChore.chorename);
            expect(res.body.chorehousehold).to.eql(expectedChore.chorehousehold);
            expect(res.body.choreuser).to.eql(expectedChore.choreuser);
          });
      });
    });
  });

  describe('POST /api/chores', () => {
    context('Happy path', () => {
      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          });
      });
      it('responds with 201 and serialized chore', () => {
        const newChore = {
          chorename: 'A new chore',
          choreuser: null,
          chorehousehold: 1
        };
        return supertest(app)
          .post('/api/chores')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newChore)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property('choreid');
            expect(res.body.chorename).to.eql(newChore.chorename);
            expect(res.body.chorehousehold).to.eql(newChore.chorehousehold);
            expect(res.body.choreuser).to.eql(newChore.choreuser);
          })
          .expect(res => {
            db
              .from('fs_chores')
              .select('*')
              .where({ choreid: res.body.choreid })
              .first()
              .then(row => {
                expect(row.chorename).to.eql(newChore.chorename);
              });
          });
      });
    });
  });

  describe('DELETE /api/chores/:choreid', () => {
    context('Given no chores', () => {
      beforeEach('insert households and users', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          });
      });
      it('responds with 404', () => {
        const badChoreId = 1234567;
        return supertest(app)
          .delete(`/api/chores/${badChoreId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Chore does not exist'
          });
      });
    });

    context('Given there are chores in the databse', () => {
      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          });
      });
      it('responds 204 and removes the chore', () => {
        const idToRemove = 3;
        const expectedChores = testChores.filter(chore => chore.choreid !== idToRemove);
        return supertest(app)
          .delete(`/api/households/${idToRemove}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(204)
          .then(res => {
            supertest(app)
              .get('/api/chores')
              .expect(expectedChores);
          });
      });
    });
  });

  describe('PATCH /api/chores/:choreid', () => {
    context('Given no chores', () => {
      beforeEach('insert households and users', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          });
      });
      it('responds with 404', () => {
        const badChoreId = 1234567;
        return supertest(app)
          .delete(`/api/chores/${badChoreId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Chore does not exist'
          });
      });
    });

    context('Given there are chores in the databse', () => {
      beforeEach('insert households, users and chores', () => {
        return helpers.seedHouseholds(
          db,
          testHouseholds
        )
          .then(() => {
            return helpers.seedUsers(
              db,
              testUsers
            );
          })
          .then(() => {
            return helpers.seedChores(
              db,
              testChores
            );
          });
      });
      it('responds with 204 and updates the chore', () => {
        const idToUpdate = 2;
        const updatedChore = {
          chorename: 'UpdatedName',
          choreuser: 3,
          chorehousehold: 3
        };
        const expectedChore = {
          ...testChores[idToUpdate - 1],
          ...updatedChore
        };
        return supertest(app)
          .patch(`/api/chores/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedChore)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/chores/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(res => {
                expect(res.body.choreid).to.eql(expectedChore.choreid);
                expect(res.body.chorename).to.eql(expectedChore.chorename);
                expect(res.body.choreuser).to.eql(expectedChore.choreuser);
                expect(res.body.chorehousehold).to.eql(expectedChore.chorehousehold);
              });
          });
      });

      it('responds with 400 when non-required fields are supplied', () => {
        const idToUpdate = 2;

        return supertest(app)
          .patch(`/api/chores/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({ irrelivantField: 'foo' })
          .expect(400, {
            error: 'Request body must contain \'chorename\', \'chorehousehold\'and \'choreuser\''
          });
      });

      it('responds with 204 when updating only a subset of fields', () => {
        const idToUpdate = 2;
        const updatedChore = {
          chorename: 'UpdatedName',
          choreuser: 3,
          chorehousehold: 3
        };
        const expectedChore = {
          ...testChores[idToUpdate - 1],
          ...updatedChore
        };

        return supertest(app)
          .patch(`/api/chores/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({
            ...updatedChore,
            fieldToIgnore: 'should not be in the GET response'
          })
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/chores/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(expectedChore);
          });
      });
    });
  });
});