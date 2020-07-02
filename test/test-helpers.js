'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
  return [
    {
      userid: 1,
      username: 'Test-User-1',
      password: 'Th1s!s4Password',
      administrator: false,
      userhousehold: 1
    },
    {
      userid: 2,
      username: 'Test-User-2',
      password: 'N0tAPassword',
      administrator: true,
      userhousehold: 1
    },
    {
      userid: 3,
      username: 'Test-User-3',
      password: '4n0th3rP4ssw0rd',
      userhousehold: 2
    }
  ];
}

function makeMaliciousUser() {
  const maliciousUser = {
    userid: 911,
    username: 'Naughty naughty very naughty <script>alert("xss");</script>',
    password: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
  };

  const expectedUser = {
    userid: 911,
    username: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    password: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
  };

  return {
    maliciousUser, 
    expectedUser
  };
}

function makeHouseholdsArray() {
  return [
    {
      householdid: 1,
      householdname: 'Test-House-1'
    },
    {
      householdid: 2,
      householdname: 'Test-House-2'
    },
    {
      householdid: 3,
      householdname: 'Test-Empty-House'
    }
  ];
}

function makeMaliciousHousehold() {
  const maliciousHousehold = {
    householdid: 911,
    householdname: 'Naughty naughty very naughty <script>alert("xss");</script>'
  };

  const expectedHousehold = {
    householdid: 911,
    householdname: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
  };

  return {
    maliciousHousehold,
    expectedHousehold
  };
}

function makeChoresArray() {
  return [
    {
      choreid: 1,
      chorename: 'Pay bills',
      chorehousehold: 1,
      choreuser: 1
    },
    {
      choreid: 2,
      chorename: 'Wash car',
      chorehousehold: 1,
      choreuser: 2
    },
    {
      choreid: 3,
      chorename: 'Take out trash',
      chorehousehold: 1
    }
  ];
}

function makeMaliciousChore() {
  const maliciousChore = {
    choreid: 911,
    chorename: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    chorehousehold: 911,
    choreuser: 911
  };

  const expectedChore = {
    choreid: 911,
    chorename: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    chorehousehold: 911,
    choreuser: 911
  };

  return {
    maliciousChore,
    expectedChore
  };
}

function cleanTables(db) {
  return db.raw(
    `TRUNCATE
            fs_users,
            fs_households,
            fs_chores
            RESTART IDENTITY CASCADE`
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }));
  return db.into('fs_users').insert(preppedUsers)
    .then(() =>
      db.raw(
        'SELECT setval (\'fs_users_userid_seq\', ?)',
        [users[users.length - 1].userid]
      )
    );
}

function seedMaliciousUser(db, maliciousUser) {
  return seedUsers(db, [maliciousUser]);
}

function seedHouseholds(db, households) {
  return db.into('fs_households').insert(households)
    .then(() =>
      db.raw(
        'SELECT setval (\'fs_households_householdid_seq\', ?)',
        [households[households.length - 1].householdid]
      )
    );
}

function seedMaliciousHousehold(db, maliciousHousehold) {
  return seedHouseholds(db, [maliciousHousehold]);
}

function seedChores(db, chores) {
  return db.into('fs_chores').insert(chores)
    .then(() =>
      db.raw(
        'SELECT setval (\'fs_chores_choreid_seq\', ?)',
        [chores[chores.length - 1].choreid]
      )
    );
}

function seedMaliciousChore(db, maliciousChore) {
  return seedChores(db, [maliciousChore]);
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ userid: user.userid }, secret, {
    subject: user.username,
    algorithm: 'HS256'
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeMaliciousUser,
  makeHouseholdsArray,
  makeMaliciousHousehold,
  makeChoresArray,
  makeMaliciousChore,
  cleanTables,
  seedUsers,
  seedMaliciousUser,
  seedHouseholds,
  seedMaliciousHousehold,
  seedChores,
  seedMaliciousChore,
  makeAuthHeader
};