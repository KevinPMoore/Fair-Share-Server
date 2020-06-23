'use strict';

const xss = require('xss');

const ChoresService = {
  getAllChores(db) {
    return db
      .from('fs_chores')
      .select(
        'choreid',
        'chorename',
        'chorehousehold',
        'choreuser'
      );
  },
  getChoreById(db, id) {
    return ChoresService.getAllChores(db)
      .where('choreid', id)
      .first();
  },
  getChoreByChoreHouseholdId(db, householdid) {
    return ChoresService.getAllChores(db)
      .where('chorehousehold', householdid);
  },
  getChoreByChoreUserId(db, userid) {
    return ChoresService.getAllChores(db)
      .where('choreuser', userid);
  },
  insertChore(db, newChore) {
    return db
      .insert(newChore)
      .into('fs_chores')
      .returning('*')
      .then(([chore]) => chore);
  },
  deleteChoreById(db, choreid) {
    return db('fs_chores')
      .where({ choreid })
      .delete();
  },
  updateChore(db, choreid, newChoreFields) {
    return db('fs_chores')
      .where({ choreid })
      .update(newChoreFields);
  },
  serializeChore(chore) {
    return {
      choreid: chore.choreid,
      chorename: xss(chore.chorename),
      chorehousehold: chore.chorehousehold,
      choreuser: chore.choreuser,
    };
  }
};

module.exports = ChoresService;