
# School Database Design

## 1. Students Table
The students table stores each student's information. It contains a student ID, name, and email address. The student ID is the primary key, and the email address must be unique. The name and email cannot be empty.

## 2. Courses Table
The courses table stores information about the courses offered by the school. It contains a course ID and course name. The course ID is the primary key, and the course name is required.

## 3. Enrolments Table
The enrolments table records which students take which courses and the grades they receive. It contains an enrolment ID, student ID, course ID, and grade. The student ID and course ID are foreign keys that link to the students and courses tables.

## 4. Relationships
One student can enrol in many courses, and one course can have many students. This creates a many-to-many relationship between students and courses.

The enrolments table is a join table that resolves this many-to-many relationship. It also stores the grade a student receives for each course. The combination of student ID and course ID is unique to prevent duplicate enrolments.

Each student can have many enrolments, and each course can have many enrolments. These are one-to-many relationships.

## 5. Index
I would add an index on the course_id column in the enrolments table. This would help the database find enrolments for a particular course more quickly.

Example:
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);

## 6. SQL or NoSQL?
I would choose SQL for this school database because the data has clear relationships between students, courses, and enrolments. SQL supports primary keys, foreign keys, unique constraints, and joins, which help maintain accurate and consistent data. The database also needs queries that count students per course and find students without enrolments. A relational database such as SQLite is suitable for this structured information.