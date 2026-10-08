
PRAGMA foreign_keys = ON;

-- 1. Create the students table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. Create the courses table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL UNIQUE
);

-- 3. Create the enrolments table
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT NOT NULL,
    UNIQUE (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- 4. Insert at least 3 students
INSERT INTO students (student_id, name, email) VALUES
(1, 'Alice', 'alice@example.com'),
(2, 'Brian', 'brian@example.com'),
(3, 'Carol', 'carol@example.com');

-- 5. Insert at least 3 courses
INSERT INTO courses (course_id, course_name) VALUES
(1, 'Mathematics'),
(2, 'English'),
(3, 'Computer Studies');

-- 6. Insert at least 5 enrolments
INSERT INTO enrolments
(enrolment_id, student_id, course_id, grade) VALUES
(1, 1, 1, 'A'),
(2, 1, 2, 'B'),
(3, 2, 1, 'B'),
(4, 2, 3, 'A'),
(5, 3, 2, 'C');

-- QUERY 1: All courses taken by one student (Alice)
SELECT students.name, courses.course_name, enrolments.grade
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE students.name = 'Alice';

-- QUERY 2: All students taking one course (Mathematics)
SELECT students.name, courses.course_name
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'Mathematics';

-- QUERY 3: Number of students per course
SELECT courses.course_name,
       COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;

-- QUERY 4: Students who have no enrolments
SELECT students.name
FROM students
LEFT JOIN enrolments ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;

-- QUERY 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE enrolment_id = 5;

-- Check the updated grade
SELECT * FROM enrolments
WHERE enrolment_id = 5;