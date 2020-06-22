CREATE TABLE chores (
    choreid INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    chorename TEXT NOT NULL,
    chorehousehold INTEGER REFERENCES households(householdid) NOT NULL,
    choreuser INTEGER REFERENCES users(userid)
);