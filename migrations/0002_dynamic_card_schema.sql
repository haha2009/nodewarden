PRAGMA foreign_keys = ON;

ALTER TABLE ciphers ADD COLUMN dynamic_schema TEXT DEFAULT NULL;
