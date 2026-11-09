-- Category tile imagery for the storefront. Nullable so existing rows keep
-- working and the client can fall back to its built-in defaults.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image VARCHAR(1024);
