CREATE USER smart_home_user WITH PASSWORD 'P@ssword';
CREATE DATABASE smart_home_db OWNER smart_home_user;
GRANT ALL PRIVILEGES ON DATABASE smart_home_db TO smart_home_user;