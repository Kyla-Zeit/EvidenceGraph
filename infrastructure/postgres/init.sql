-- EvidenceGraph PostgreSQL Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Performance / indexing tuning hints
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
