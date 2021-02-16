ALTER TABLE users ADD COLUMN "roles" TEXT;
UPDATE users SET roles = "|standard|" WHERE username <> 'admin';
UPDATE users SET roles = "|admin|standard|" WHERE username = 'admin';
