BEGIN;

TRUNCATE households RESTART IDENTITY CASCADE;

INSERT INTO households (householdname)
VALUES
    ('DemoHouse'),
    ('Kebin & Shelpys House');
    
COMMIT;