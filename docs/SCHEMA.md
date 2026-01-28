2026-01-28 16:13:38,323 INFO sqlalchemy.engine.Engine select pg_catalog.version()
2026-01-28 16:13:38,324 INFO sqlalchemy.engine.Engine [raw sql] ()
2026-01-28 16:13:38,342 INFO sqlalchemy.engine.Engine select current_schema()
2026-01-28 16:13:38,342 INFO sqlalchemy.engine.Engine [raw sql] ()
2026-01-28 16:13:38,357 INFO sqlalchemy.engine.Engine show standard_conforming_strings
2026-01-28 16:13:38,357 INFO sqlalchemy.engine.Engine [raw sql] ()
--- Tables in Database ---
2026-01-28 16:13:38,369 INFO sqlalchemy.engine.Engine BEGIN (implicit)
2026-01-28 16:13:38,369 INFO sqlalchemy.engine.Engine SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
2026-01-28 16:13:38,369 INFO sqlalchemy.engine.Engine [generated in 0.00023s] ()
Table: teaching_assignment
2026-01-28 16:13:38,420 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teaching_assignment'
2026-01-28 16:13:38,420 INFO sqlalchemy.engine.Engine [generated in 0.00034s] ()
  - instructor_id (integer)
  - course_id (integer)
  - role (character varying)
Table: university
2026-01-28 16:13:38,484 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'university'
2026-01-28 16:13:38,485 INFO sqlalchemy.engine.Engine [generated in 0.00037s] ()
  - university_id (integer)
  - name (character varying)
  - country (character varying)
Table: course
2026-01-28 16:13:38,501 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'course'
2026-01-28 16:13:38,502 INFO sqlalchemy.engine.Engine [generated in 0.00029s] ()
  - course_id (integer)
  - duration_weeks (integer)
  - university_id (integer)
  - program_id (integer)
  - textbook_id (integer)
  - course_name (character varying)
Table: program
2026-01-28 16:13:38,517 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'program'
2026-01-28 16:13:38,518 INFO sqlalchemy.engine.Engine [generated in 0.00026s] ()
  - program_id (integer)
  - duration_weeks_or_months (integer)
  - program_name (character varying)
  - program_type (character varying)
Table: textbook
2026-01-28 16:13:38,533 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'textbook'
2026-01-28 16:13:38,533 INFO sqlalchemy.engine.Engine [generated in 0.00022s] ()
  - textbook_id (integer)
  - title (character varying)
  - isbn (character varying)
  - url (text)
Table: course_topic
2026-01-28 16:13:38,549 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'course_topic'
2026-01-28 16:13:38,549 INFO sqlalchemy.engine.Engine [generated in 0.00025s] ()
  - course_id (integer)
  - topic_id (integer)
Table: topic
2026-01-28 16:13:38,564 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'topic'
2026-01-28 16:13:38,564 INFO sqlalchemy.engine.Engine [generated in 0.00030s] ()
  - topic_id (integer)
  - topic_name (character varying)
Table: instructor
2026-01-28 16:13:38,579 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'instructor'
2026-01-28 16:13:38,580 INFO sqlalchemy.engine.Engine [generated in 0.00020s] ()
  - instructor_id (integer)
  - full_name (character varying)
  - email (character varying)
Table: student
2026-01-28 16:13:38,596 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student'
2026-01-28 16:13:38,596 INFO sqlalchemy.engine.Engine [generated in 0.00039s] ()
  - student_id (integer)
  - age (integer)
  - full_name (character varying)
  - country (character varying)
  - category (character varying)
  - skill_level (character varying)
Table: enrollment
2026-01-28 16:13:38,611 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'enrollment'
2026-01-28 16:13:38,611 INFO sqlalchemy.engine.Engine [generated in 0.00036s] ()
  - student_id (integer)
  - course_id (integer)
  - enroll_date (date)
  - evaluation_score (integer)
Table: content_item
2026-01-28 16:13:38,627 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'content_item'
2026-01-28 16:13:38,627 INFO sqlalchemy.engine.Engine [generated in 0.00035s] ()
  - content_id (integer)
  - course_id (integer)
  - content_type (character varying)
  - title (character varying)
  - url (text)
Table: app_user
2026-01-28 16:13:38,644 INFO sqlalchemy.engine.Engine SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_user'
2026-01-28 16:13:38,644 INFO sqlalchemy.engine.Engine [generated in 0.00025s] ()
  - id (integer)
  - created_at (timestamp with time zone)
  - email (character varying)
  - password_hash (character varying)
  - role (character varying)
--------------------------
2026-01-28 16:13:38,662 INFO sqlalchemy.engine.Engine ROLLBACK
