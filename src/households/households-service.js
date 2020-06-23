'use strict';

const xss = require('xss');

const HouseholdsService = {
  getAllHouseholds(db) {
    return db
      .from('fs_households')
      .select(
        'householdid',
        'householdname'
      );
  },
  getHouseholdById(db, id) {
    return HouseholdsService.getAllHouseholds(db)
      .where('householdid', id)
      .first();
  },
  insertHousehold(db, newHousehold) {
    return db
      .insert(newHousehold)
      .into('fs_households')
      .returning('*')
      .then(([household]) => household);
  },
  deleteHouseById(db, householdid) {
    return db('fs_households')
      .where({ householdid })
      .delete();
  },
  updateHousehold(db, householdid, newUserFields) {
    return db('fs_households')
      .where({ householdid })
      .update(newUserFields);
  },
  serializeHousehold(household) {
    return {
      id: household.id,
      householdname: xss(household.householdname)
    };
  }
};

module.exports = HouseholdsService;