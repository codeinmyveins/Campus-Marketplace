-- CREATE DATABASE campus_marketplace;
-- USE campus_marketplace;

CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'gender_enum' 
    ) THEN 
        CREATE TYPE GENDER_ENUM AS ENUM ('male', 'female', 'other');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'role_enum' 
    ) THEN 
        CREATE TYPE ROLE_ENUM AS ENUM ('reverify_required', 'user', 'admin');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'status_enum' 
    ) THEN 
        CREATE TYPE STATUS_ENUM AS ENUM ('unverified', 'verified');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'item_type_enum' 
    ) THEN 
        CREATE TYPE ITEM_TYPE_ENUM AS ENUM ('sell', 'buy', 'lend', 'borrow');
    END IF;
END
$$ LANGUAGE plpgsql;


CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 16 AND username ~ '^[a-zA-Z0-9_]+$'),
    full_name TEXT NOT NULL CHECK (char_length(full_name) <= 64 AND full_name ~ '^[a-zA-Z\s]+$'),

    email TEXT UNIQUE NOT NULL CHECK (
        email ~* '^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$'
    ),

    password TEXT NOT NULL,

    dob DATE NOT NULL CHECK (dob < CURRENT_DATE),

    country_code TEXT NOT NULL CHECK (char_length(country_code) = 2 AND country_code ~ '^[A-Z]+$'),
    phone TEXT UNIQUE NOT NULL CHECK (phone ~ '^(\+|\d)\d{1,4}\s[0-9]{7,16}$'),

    college_id INTEGER NOT NULL,

    gender GENDER_ENUM NOT NULL,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 2048),
    role ROLE_ENUM NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS pre_users (
    id SERIAL PRIMARY KEY,

    username TEXT NOT NULL CHECK (char_length(username) BETWEEN 3 AND 16 AND username ~ '^[a-zA-Z0-9_]+$'),
    full_name TEXT CHECK (char_length(full_name) <= 64 AND full_name ~ '^[a-zA-Z\s]+$'),

    email TEXT NOT NULL CHECK (
        email ~* '^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$'
    ),

    password TEXT NOT NULL,

    dob DATE CHECK (dob < CURRENT_DATE),

    country_code TEXT CHECK (char_length(country_code) = 2 AND country_code ~ '^[A-Z]+$'),
    phone TEXT CHECK (phone ~ '^(\+|\d)\d{1,4}\s[0-9]{7,16}$'),

    college_id INTEGER,

    gender GENDER_ENUM,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 2048),

    status STATUS_ENUM NOT NULL DEFAULT 'unverified',

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL,
    hashed_refresh_token TEXT UNIQUE NOT NULL,
    device_fingerprint TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    ip_address INET NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, device_fingerprint)
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,

    item_name TEXT NOT NULL CHECK (char_length(item_name) <= 32),
    item_category TEXT NOT NULL CHECK (char_length(item_category) <= 32),
    price NUMERIC(10, 2) CHECK (price >= 0),

    title TEXT NOT NULL CHECK (char_length(title) <= 64),
    description TEXT NOT NULL CHECK (char_length(description) <= 16384),

    document tsvector GENERATED ALWAYS AS (
        to_tsvector('english', item_name || ' ' || title || ' ' || item_category || ' ' || description)
    ) STORED,

    location GEOGRAPHY(Point, 4326),

    image_count INTEGER NOT NULL DEFAULT 0 CHECK (image_count >= 0),

    type ITEM_TYPE_ENUM NOT NULL,
    closed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_closed_false ON items (closed) WHERE closed = false;

CREATE INDEX IF NOT EXISTS idx_items_document ON items USING GIN (document);

CREATE TABLE IF NOT EXISTS item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    order_idx INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    url TEXT NOT NULL,

    UNIQUE (item_id, order_idx),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_modified_at'
    ) THEN
        CREATE TRIGGER update_modified_at
        BEFORE UPDATE ON items
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS data_flags (
  id TEXT PRIMARY KEY,
  loaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT,
    district TEXT
);

CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY,
    uni_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,

    document tsvector GENERATED ALWAYS AS (to_tsvector('english', name)) STORED,

    FOREIGN KEY (uni_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cllgs_document ON colleges USING GIN (document);

ALTER TABLE pre_users ADD FOREIGN KEY (college_id) REFERENCES colleges(id);
ALTER TABLE users ADD FOREIGN KEY (college_id) REFERENCES colleges(id);
