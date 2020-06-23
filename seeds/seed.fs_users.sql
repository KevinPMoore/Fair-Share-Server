BEGIN;

TRUNCATE fs_users RESTART IDENTITY CASCADE;

INSERT INTO fs_users (username, password, userhousehold)
VALUES
    ('DemoUser', 'P4ssW0rd!', 1),
    ('Kebin', 'G00dpassword!', 2),
    ('Shelpy', 'B3tter!P4ss', 2);
    
COMMIT;