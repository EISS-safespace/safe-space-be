-- ============================================
-- SafeSpace Database Initialization
-- ============================================

-- Create database if not exists (handled by POSTGRES_DB env var)
-- This script runs after database creation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Create Schemas for Microservices
-- ============================================

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS mood;
CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS moderation;
CREATE SCHEMA IF NOT EXISTS wellness;
CREATE SCHEMA IF NOT EXISTS professional;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ============================================
-- Set Search Path
-- ============================================

-- Default search path includes all schemas
ALTER DATABASE safespace_db SET search_path TO public, auth, users, content, mood, chat, moderation, wellness, professional, media, notifications;

-- ============================================
-- Create Enum Types
-- ============================================

-- Post types
CREATE TYPE content.post_type AS ENUM ('vent', 'success', 'question', 'general');

-- Mood types
CREATE TYPE mood.mood_type AS ENUM ('anxious', 'depressed', 'stressed', 'calm', 'happy', 'neutral', 'overwhelmed', 'hopeful');

-- Reaction types
CREATE TYPE content.reaction_type AS ENUM ('me_too', 'support', 'helpful', 'inspiring');

-- Trigger warning types
CREATE TYPE content.trigger_warning AS ENUM ('self_harm', 'suicide', 'eating_disorder', 'substance_abuse', 'violence', 'trauma');

-- User roles
CREATE TYPE auth.user_role AS ENUM ('user', 'therapist', 'moderator', 'admin');

-- Moderation status
CREATE TYPE moderation.moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT USAGE ON SCHEMA users TO PUBLIC;
GRANT USAGE ON SCHEMA content TO PUBLIC;
GRANT USAGE ON SCHEMA mood TO PUBLIC;
GRANT USAGE ON SCHEMA chat TO PUBLIC;
GRANT USAGE ON SCHEMA moderation TO PUBLIC;
GRANT USAGE ON SCHEMA wellness TO PUBLIC;
GRANT USAGE ON SCHEMA professional TO PUBLIC;
GRANT USAGE ON SCHEMA media TO PUBLIC;
GRANT USAGE ON SCHEMA notifications TO PUBLIC;

-- Grant all privileges on all tables in schemas (for future tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA content GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA mood GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA chat GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA moderation GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA wellness GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA professional GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA media GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA notifications GRANT ALL ON TABLES TO PUBLIC;

-- ============================================
-- Create Indexes for Performance
-- ============================================

-- Note: Specific indexes will be created by Sequelize migrations
-- This is just for initial setup

-- ============================================
-- Create Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Logging
-- ============================================

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'SafeSpace database initialized successfully';
    RAISE NOTICE 'Schemas created: auth, users, content, mood, chat, moderation, wellness, professional, media, notifications';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto';
END $$;

