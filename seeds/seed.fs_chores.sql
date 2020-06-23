BEGIN;

TRUNCATE fs_chores RESTART IDENTITY CASCADE;

INSERT INTO fs_chores (chorename, chorehousehold, choreuser)
VALUES
    ('Rake Leaves', 1, 1),
    ('Pay Bills', 1, null),
    ('Walk Dog', 2, 2),
    ('Take Out Trash', 2, 3),
    ('Sweep Floor', 2, null);
    
COMMIT;