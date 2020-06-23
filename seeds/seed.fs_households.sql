BEGIN;

TRUNCATE fs_households RESTART IDENTITY CASCADE;

INSERT INTO fs_households (householdname)
VALUES
    ('DemoHouse'),
    ('Kebin & Shelpys House');
    
COMMIT;