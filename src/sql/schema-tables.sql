-- Drop existing tables if they exist (for reset purposes)
DROP TABLE IF EXISTS user_responses;
DROP TABLE IF EXISTS aptitude_questions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS aptitude_tests;
DROP TABLE IF EXISTS users;

-- Table: Users
CREATE TABLE users (
    regno VARCHAR(7) PRIMARY KEY NOT NULL,
    name VARCHAR(50) NOT NULL,
    trade VARCHAR(3),
    batch VARCHAR(4),
    role VARCHAR(10) NOT NULL,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    access_token VARCHAR(255),
    blocked INT DEFAULT 0
);

-- Table: AptitudeTests
CREATE TABLE aptitude_tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    test_timestamp VARCHAR(30)  NOT NULL,   -- unix timestamp
    duration INT NOT NULL,
    total_questions INT DEFAULT 0  
);
-- Table: Questions
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    topic_tags TEXT[],
    question_type VARCHAR(50) NOT NULL, 
    last_used TIMESTAMP DEFAULT NULL,
    difficulty_level INT NOT NULL,
    options TEXT[] NOT NULL,
    correct_option INT NOT NULL
);


-- Table: AptitudeQuestions
CREATE TABLE aptitude_questions (
    id SERIAL PRIMARY KEY,
    aptitude_test_id INT NOT NULL REFERENCES AptitudeTests(id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES Questions(id) ON DELETE CASCADE
);


-- Table: UserResponses
CREATE TABLE user_responses (
    id SERIAL PRIMARY KEY,
    regno VARCHAR(7) NOT NULL REFERENCES Users(regno) ON DELETE CASCADE,
    aptitude_test_id INT NOT NULL REFERENCES AptitudeTests(id) ON DELETE CASCADE,
    answers TEXT NOT NULL,
    response_time  VARCHAR(30) NOT NULL,
    marks INT DEFAULT 0
);

-- Table: JSPRS
CREATE TABLE jsprs (
    id SERIAL PRIMARY KEY,
    regno VARCHAR(7) NOT NULL UNIQUE REFERENCES Users(regno) ON DELETE CASCADE ,
);


-- DSA Sheet Questions
CREATE TABLE dsa_questions (
    id SERIAL PRIMARY KEY,
   name TEXT NOT NULL,
   link TEXT NOT NULL,
   folder TEXT NOT NULL,
   order INT NOT NULL
);

-- DSA Sheet Solved Questions
CREATE TABLE dsa_solved (
    id SERIAL PRIMARY KEY,
    regno VARCHAR(7) NOT NULL REFERENCES Users(regno) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
);