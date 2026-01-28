-- DBMS Lab Assignment II: SQL (PostgreSQL)
-- Topic: Online Course Management Platform
-- Sequence: (i) Table definitions, (ii) Row insertions, (iii) SQL queries

-- PART I: TABLE DEFINITIONS (DDL)

CREATE TABLE university (
    university_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(50) NOT NULL
);

CREATE TABLE program (
    program_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_name VARCHAR(100) NOT NULL,
    program_type VARCHAR(50) NOT NULL, -- certificate/diploma/degree
    duration_weeks_or_months INT NOT NULL CHECK (duration_weeks_or_months > 0)
);

CREATE TABLE topic (
    topic_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE textbook (
    textbook_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    url TEXT
);

CREATE TABLE course (
    course_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL UNIQUE,
    duration_weeks INT NOT NULL CHECK (duration_weeks > 0),
    university_id INT NOT NULL REFERENCES university(university_id),
    program_id INT NOT NULL REFERENCES program(program_id),
    textbook_id INT NOT NULL REFERENCES textbook(textbook_id)
);

CREATE TABLE course_topic (
    course_id INT NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    topic_id INT NOT NULL REFERENCES topic(topic_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, topic_id)
);

CREATE TABLE instructor (
    instructor_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE
);

CREATE TABLE teaching_assignment (
    instructor_id INT NOT NULL REFERENCES instructor(instructor_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    role VARCHAR(50),
    PRIMARY KEY (instructor_id, course_id)
);

CREATE TABLE student (
    student_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age >= 13 AND age <= 100),
    country VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    skill_level VARCHAR(50)
);

CREATE TABLE enrollment (
    student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    enroll_date DATE NOT NULL,
    evaluation_score INT CHECK (evaluation_score >= 0 AND evaluation_score <= 100),
    PRIMARY KEY (student_id, course_id)
);

CREATE TABLE content_item (
    content_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id INT NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    content_type VARCHAR(30) NOT NULL, -- book/video/notes
    title VARCHAR(150) NOT NULL,
    url TEXT
);

-- PART II: SAMPLE DATA INSERTION (DML)

INSERT INTO university (name, country) VALUES
('IITKGP', 'India'),
('Stanford University', 'USA'),
('MIT', 'USA'),
('Oxford University', 'UK'),
('IIT Bombay', 'India');

INSERT INTO program (program_name, program_type, duration_weeks_or_months) VALUES
('AI Fundamentals', 'certificate', 6),
('Advanced AI', 'certificate', 8),
('Machine Learning Basics', 'certificate', 12),
('Data Science Diploma', 'diploma', 24),
('Computer Science Degree', 'degree', 104);

INSERT INTO topic (topic_name) VALUES
('AI'),
('Machine Learning'),
('Deep Learning'),
('Natural Language Processing'),
('Computer Vision'),
('GenAI'),
('Python Programming'),
('Data Analysis');

INSERT INTO textbook (title, isbn, url) VALUES
('Artificial Intelligence: A Modern Approach', '978-0136042594', 'https://example.com/ai-modern'),
('Deep Learning', '978-0262035613', 'https://example.com/deep-learning'),
('Machine Learning Yearbook', '978-0262740524', 'https://example.com/ml-yearbook'),
('Python for Data Science', '978-1491957660', 'https://example.com/python-data'),
('Natural Language Processing with Python', '978-0596516499', 'https://example.com/nlp-python');

-- university_id and program_id match insertion order (1..n)
INSERT INTO course (course_name, duration_weeks, university_id, program_id, textbook_id) VALUES
('GenAI', 6, 1, 1, 1),
('AI Basics', 8, 1, 1, 1),
('Advanced Machine Learning', 12, 2, 2, 2),
('Deep Learning Specialization', 16, 2, 2, 2),
('NLP Fundamentals', 10, 3, 1, 5),
('Computer Vision 101', 12, 1, 1, 2),
('Python Essentials', 6, 4, 1, 4),
('Data Science Masterclass', 20, 5, 3, 4);

INSERT INTO course_topic (course_id, topic_id) VALUES
(1, 1), (1, 6),
(2, 1), (2, 7),
(3, 2), (3, 3),
(4, 3), (4, 2),
(5, 4), (5, 7),
(6, 5), (6, 1),
(7, 7),
(8, 2), (8, 8);

INSERT INTO instructor (full_name, email) VALUES
('Andrew Ng', 'andrew.ng@stanford.edu'),
('Yann LeCun', 'yann.lecun@mit.edu'),
('Yoshua Bengio', 'yoshua.bengio@oxford.edu'),
('Fei-Fei Li', 'fei-fei@stanford.edu'),
('Ian Goodfellow', 'ian.goodfellow@mit.edu');

INSERT INTO teaching_assignment (instructor_id, course_id, role) VALUES
(1, 1, 'instructor'),
(1, 2, 'instructor'),
(2, 3, 'instructor'),
(2, 4, 'instructor'),
(3, 5, 'instructor'),
(4, 6, 'instructor'),
(1, 7, 'teaching_assistant'),
(5, 8, 'instructor');

INSERT INTO student (full_name, age, country, category, skill_level) VALUES
('Ashutosh Shamra', 21, 'India', 'student', 'intermediate'),
('Priya Singh', 17, 'India', 'student', 'beginner'),
('John Smith', 35, 'USA', 'professional', 'advanced'),
('Emma Johnson', 28, 'UK', 'professional', 'intermediate'),
('Wei Chen', 22, 'China', 'student', 'intermediate'),
('Carlos Rodriguez', 65, 'Spain', 'professional', 'beginner'),
('Ananya Mishra', 16, 'India', 'student', 'beginner'),
('Michael Brown', 45, 'Canada', 'professional', 'advanced'),
('Sophia Patel', 30, 'India', 'professional', 'intermediate'),
('Liam O''Connor', 72, 'Ireland', 'professional', 'beginner');

INSERT INTO enrollment (student_id, course_id, enroll_date, evaluation_score) VALUES
(1, 1, '2025-11-01', 88),
(2, 1, '2025-11-05', 92),
(3, 1, '2025-11-02', 85),
(4, 1, '2025-11-08', 90),
(7, 1, '2025-11-10', 78),

(1, 2, '2025-10-01', 82),
(5, 2, '2025-10-05', 76),
(8, 2, '2025-10-03', 91),
(9, 2, '2025-10-07', 87),

(3, 3, '2025-09-01', 94),
(4, 3, '2025-09-04', 88),
(8, 3, '2025-09-02', 92),

(5, 4, '2025-08-01', 85),
(9, 4, '2025-08-05', 89),

(1, 5, '2025-07-01', 86),
(6, 5, '2025-07-08', 45),

(3, 6, '2025-06-01', 91),
(7, 6, '2025-06-03', 65),
(9, 6, '2025-06-05', 88),

(2, 7, '2025-05-01', 89),
(5, 7, '2025-05-03', 92),
(10, 7, '2025-05-10', 38),

(1, 8, '2025-04-01', 90),
(4, 8, '2025-04-05', 87),
(9, 8, '2025-04-08', 93);

-- PART III: SQL QUERIES (1..10)
-- Note: 6 months approximated as 26 weeks.

-- Q1
SELECT DISTINCT c.course_name
FROM course c
JOIN program p ON c.program_id = p.program_id
JOIN course_topic ct ON c.course_id = ct.course_id
JOIN topic t ON ct.topic_id = t.topic_id
WHERE p.program_type = 'certificate'
  AND t.topic_name = 'AI'
  AND c.duration_weeks <= 26;

-- Q2
SELECT DISTINCT c.course_name
FROM course c
JOIN program p ON c.program_id = p.program_id
JOIN university u ON c.university_id = u.university_id
JOIN course_topic ct ON c.course_id = ct.course_id
JOIN topic t ON ct.topic_id = t.topic_id
WHERE p.program_type = 'certificate'
  AND t.topic_name = 'AI'
  AND c.duration_weeks <= 26
  AND u.name = 'IITKGP';

-- Q3
SELECT DISTINCT s.full_name
FROM student s
JOIN enrollment e ON s.student_id = e.student_id
JOIN course c ON e.course_id = c.course_id
WHERE (s.age < 18 OR s.age > 60)
  AND c.course_name = 'GenAI';

-- Q4
SELECT DISTINCT s.full_name
FROM student s
JOIN enrollment e ON s.student_id = e.student_id
JOIN course c ON e.course_id = c.course_id
JOIN university u ON c.university_id = u.university_id
JOIN course_topic ct ON c.course_id = ct.course_id
JOIN topic t ON ct.topic_id = t.topic_id
WHERE s.country <> 'India'
  AND t.topic_name = 'AI'
  AND u.name = 'IITKGP';

-- Q5
SELECT DISTINCT s.country
FROM student s
JOIN enrollment e ON s.student_id = e.student_id
JOIN course c ON e.course_id = c.course_id
JOIN teaching_assignment ta ON c.course_id = ta.course_id
JOIN instructor i ON ta.instructor_id = i.instructor_id
WHERE i.full_name = 'Andrew Ng'
ORDER BY s.country;

-- Q6
SELECT DISTINCT i.full_name
FROM instructor i
JOIN teaching_assignment ta ON i.instructor_id = ta.instructor_id
JOIN enrollment e ON ta.course_id = e.course_id
JOIN student s ON e.student_id = s.student_id
WHERE s.country = 'India';

-- Q7 (at least one student overlaps with GenAI takers)
SELECT DISTINCT c.course_name
FROM course c
WHERE EXISTS (
  SELECT 1
  FROM enrollment e1
  JOIN enrollment e2 ON e1.student_id = e2.student_id
  JOIN course gen ON e2.course_id = gen.course_id
  WHERE e1.course_id = c.course_id
    AND gen.course_name = 'GenAI'
);

-- Q8 (all students of the course have taken GenAI)
SELECT c.course_name
FROM course c
WHERE EXISTS (SELECT 1 FROM enrollment e WHERE e.course_id = c.course_id) -- ensure at least 1 student
AND NOT EXISTS (
  SELECT 1
  FROM enrollment e1
  WHERE e1.course_id = c.course_id
    AND NOT EXISTS (
      SELECT 1
      FROM enrollment e2
      JOIN course gen ON gen.course_id = e2.course_id
      WHERE e2.student_id = e1.student_id
        AND gen.course_name = 'GenAI'
    )
);

-- Q9 (most popular IITKGP course)
SELECT c.course_name, COUNT(*) AS student_count
FROM course c
JOIN university u ON c.university_id = u.university_id
JOIN enrollment e ON c.course_id = e.course_id
WHERE u.name = 'IITKGP'
GROUP BY c.course_id, c.course_name
ORDER BY student_count DESC
LIMIT 1;

-- Q10 (Indian student with highest average marks across AI-topic courses)
SELECT s.full_name, AVG(e.evaluation_score) AS avg_score
FROM student s
JOIN enrollment e ON s.student_id = e.student_id
JOIN course c ON e.course_id = c.course_id
JOIN course_topic ct ON c.course_id = ct.course_id
JOIN topic t ON ct.topic_id = t.topic_id
WHERE s.country = 'India'
  AND t.topic_name = 'AI'
GROUP BY s.student_id, s.full_name
ORDER BY avg_score DESC
LIMIT 1;
