BEGIN;

TRUNCATE users RESTART IDENTITY CASCADE;

INSERT INTO users (username, password)
VALUES
    ('DemoUser', 'P4ssW0rd!'),
    ('Kebin', 'G00dpassword!'),
    ('Shelpy', 'B3tter!P4ss')