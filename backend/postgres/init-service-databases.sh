#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER market WITH PASSWORD 'market';
    CREATE DATABASE market OWNER market;

    CREATE USER franchise WITH PASSWORD 'franchise';
    CREATE DATABASE franchise OWNER franchise;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname market <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL
