-- CREATE DATABASE campus_marketplace;
-- USE campus_marketplace;

CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'gender_enum' 
    ) THEN 
        CREATE TYPE GENDER_ENUM AS ENUM ('male', 'female');
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

    college_name TEXT NOT NULL CHECK (char_length(college_name) <= 64 AND college_name ~ '^[a-zA-Z\s]+$'),

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

    college_name TEXT CHECK (char_length(college_name) <= 64 AND college_name ~ '^[a-zA-Z\s]+$'),
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
    body TEXT NOT NULL CHECK (char_length(body) <= 16384),

    location GEOGRAPHY(Point, 4326),

    image_count INTEGER NOT NULL DEFAULT 0,

    type ITEM_TYPE_ENUM NOT NULL,
    closed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) <= 32),
    url TEXT NOT NULL,

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
