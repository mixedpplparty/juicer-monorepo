-- Table for Discord servers
CREATE TABLE servers (
    server_id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for roles within a server (needed for referential integrity)
CREATE TABLE roles (
    role_id BIGINT PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(server_id) ON DELETE CASCADE
);

-- Table for game categories, specific to each server
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(server_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    -- UNIQUE(server_id, name) -- Category names must be unique within a server
);

-- Table for games, linked to a server and a category
CREATE TABLE games (
    game_id SERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(server_id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL, -- If a category is deleted, the game remains but without a category
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- UNIQUE(server_id, name) -- Game names must be unique within a server
);

-- Table for tags, specific to each server
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(server_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    -- UNIQUE(server_id, name) -- Tag names must be unique within a server
);

-- JUNCTION TABLE for the many-to-many relationship between games and tags
CREATE TABLE game_tags (
    game_id INT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, tag_id) -- Ensures a tag is only applied once per game
);

-- JUNCTION TABLE for the many-to-many relationship between games and roles
CREATE TABLE game_roles (
    game_id INT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, role_id) -- Ensures a role is only mapped once per game
);