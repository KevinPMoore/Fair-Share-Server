BEGIN;

TRUNCATE chores RESTART IDENTITY CASCADE;

INSERT INTO chores (chorename, chorehouse, choreuser)
VALUES
    ('Rake Leaves', 1, 1),
    ('Pay Bills', 1),
    ('Walk Dog', 2, 2),
    ('Take Out Trash', 2, 3),
    ('Sweep Floor', 2);
    
COMMIT;