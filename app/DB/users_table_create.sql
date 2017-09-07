CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(40),
    email VARCHAR(40),
    img TEXT,
    auth_id TEXT
);