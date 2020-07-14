'use strict';
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');
const { expect } = require('chai');

describe('Households Endpoints', function () {
  let db;
  const testHouseholds = helpers.makeHouseholdsArray();
  const testHousehold = testHouseholds[0];
  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];
  const testChores = helpers.makeChoresArray();

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

  describe('GET /api/households', () => {
    context('Given no households', () => {
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
      it('responds with 200 and an array', () => {
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body).to.be.an('array')
          })
      });
    });

    context('Given there are households', () => {
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
      it('responds with 200 and a list of households', () => {
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            res.body.forEach(household => {
              expect(household).to.have.property('householdname');
              expect(household).to.have.property('householdid');
            });
            expect(res.body.length).to.eql(testHouseholds.length);
          });
      });
    });

    context('Given an XSS attack household', () => {
      const {
        maliciousHousehold,
        expectedHousehold
      } = helpers.makeMaliciousHousehold();

      beforeEach('insert households, malicious household and users', () => {
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
            return helpers.seedMaliciousHousehold(
              db,
              maliciousHousehold
            )
          });
      });
      it('removes XSS attack content ', () => {
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body[3].householdname).to.eql(expectedHousehold.householdname);
            expect(res.body[3].householdid).to.eql(expectedHousehold.householdid);
          });
      });
    });
  });

  describe('GET /api/households/:householdid', () => {
    context('Given no households', () => {
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
        const badHouseholdId = 1234567;
        return supertest(app)
          .get(`/api/households/${badHouseholdId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Household does not exist'
          });
      });
    });

    context('Given there are households', () => {
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
      it('responds with 200 and the specified household', () => {
        const householdId = 2;
        const expectedHousehold = testHouseholds[householdId - 1];
        return supertest(app)
          .get(`/api/households/${householdId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body.householdid).to.eql(expectedHousehold.householdid);
            expect(res.body.householdname).to.eql(expectedHousehold.householdname);
          });
      });
    });

    context('Given an XSS attack household', () => {
      const { 
        maliciousHousehold, 
        expectedHousehold
      } = helpers.makeMaliciousHousehold();
      
      beforeEach('insert households, malicious household and users', () => {
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
            return helpers.seedMaliciousHousehold(
              db,
              maliciousHousehold
            )
          });
      });
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/households/${maliciousHousehold.householdid}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body.householdname).to.eql(expectedHousehold.householdname);
          });
      });
    });
  });

  describe('POST /api/households', () => {
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
    context('Happy path', () => {
      it('responds with 201 and serialized household', () => {
        const newHousehold = {
          householdname: 'A new household'
        };
        return supertest(app)
          .post('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newHousehold)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property('householdid');
            expect(res.body.householdname).to.eql(newHousehold.householdname);
          })
          .expect(res => {
            db
              .from('fs_households')
              .select('*')
              .where({ householdid: res.body.householdid })
              .first()
              .then(row => {
                expect(row.householdname).to.eql(newHousehold.householdname);
              });
          });
      });
    });
  });

  describe('DELETE /api/households/:householdid', () => {
    context('Given no households', () => {
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
        const badHouseholdId = 1234567;
        return supertest(app)
          .delete(`/api/households/${badHouseholdId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Household does not exist'
          });
      });
    });
  });

  context('Given there are households in the database', () => {
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
    it('responds 204 and removes the household', () => {
      const idToRemove = 2;
      const expectedHouseholds = testHouseholds.filter(household => household.householdid !== idToRemove);
      return supertest(app)
        .delete(`/api/households/${idToRemove}`)
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .expect(204)
        .then(res => {
          supertest(app)
            .get('/api/households')
            .expect(expectedHouseholds);
        });
    });
  });

  describe('PATCH /api/households/:householdid', () => {
    context('Given no households', () => {
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
        const badHouseholdId = 1234567;
        return supertest(app)
          .delete(`/api/households/${badHouseholdId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Household does not exist'
          });
      });
    });

    context('Given there are households in the databse', () => {
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
      it('responds with 204 and updates the household', () => {
        const idToUpdate = 2;
        const updatedHousehold = {
          householdname: 'UpdatedName'
        };
        const expectedHousehold = {
          ...testHouseholds[idToUpdate - 1],
          ...updatedHousehold
        };
        return supertest(app)
          .patch(`/api/households/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedHousehold)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/households/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(res => {
                expect(res.body.householdid).to.eql(expectedHousehold.householdid);
                expect(res.body.householdname).to.eql(expectedHousehold.householdname);
              });
          });
      });

      it('responds with 400 when non-required fields are supplied', () => {
        const idToUpdate = 2;

        return supertest(app)
          .patch(`/api/households/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({ irrelivantField: 'foo' })
          .expect(400, {
            error: 'Request body must contain \'householdname\''
          });
      });

      it('responds with 204 when updating only a subset of fields', () => {
        const idToUpdate = 2;
        const updatedHousehold = {
          householdname: 'UpdatedName'
        };
        const expectedHousehold = {
          ...testHouseholds[idToUpdate - 1],
          ...updatedHousehold
        };

        return supertest(app)
          .patch(`/api/households/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({
            ...updatedHousehold,
            fieldToIgnore: 'should not be in the GET response'
          })
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/households/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(res => {
                expect(res.body.householdid).to.eql(expectedHousehold.householdid);
                expect(res.body.householdname).to.eql(expectedHousehold.householdname);
              });
          });
      });
    });
  });

  describe('GET /api/households/:householdid/users', () => {
    context('Given no households', () => {
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
        const badHouseholdId = 1234567;
        return supertest(app)
          .get(`/api/households/${badHouseholdId}/users`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, {
            error: 'Household does not exist'
          });
      });
    });

    context('Given there are households but no users', () => {
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
        const householdNoUsers = testHouseholds[2];
        return supertest(app)
          .get(`/api/households/${householdNoUsers.householdid}/users`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, []);
      });
    });

    context('Given there are households and users', () => {
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
      it('responds with a list of users for the specified household', () => {
        return supertest(app)
          .get(`/api/households/${testHousehold.householdid}/users`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            res.body.forEach(user => {
              expect(user.userhousehold).to.eql(testHousehold.householdid);
              expect(user).to.have.property('username');
            });
          });
      });
    });

    describe('GET /api/households/:/householdid/chores', () => {
      context('Given no households', () => {
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
              helpers.seedChores(
                db,
                testChores
              );
            });
        });
        it('responds with 404', () => {
          const badHouseholdId = 1234567;
          return supertest(app)
            .get(`/api/households/${badHouseholdId}/chores`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(404, {
              error: 'Household does not exist'
            });
        });
      });

      context('Given there are households but no chores', () => {
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
              helpers.seedChores(
                db,
                testChores
              );
            });
        });
        it('responds with 200 and an empty list', () => {
          const householdNoUsers = testHouseholds[2];
          return supertest(app)
            .get(`/api/users/${householdNoUsers.householdid}/chores`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(200, []);
        });
      });

      context('Given there are households and chores', () => {
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
              helpers.seedChores(
                db,
                testChores
              );
            });
        });
        it('responds with a list of chores for the specified household', () => {
          return supertest(app)
            .get(`/api/households/${testHousehold.householdid}/chores`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(res => {
              res.body.forEach(chore => {
                expect(chore.chorehousehold).to.eql(testHousehold.householdid);
                expect(chore).to.have.property('chorename');
              });
            });
        });
      });
    });
  });
});