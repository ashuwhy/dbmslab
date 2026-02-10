-- -------------------------------------------------------------
-- TablePlus 6.4.4(604)
--
-- https://tableplus.com/
--
-- Database: 23CS10005
-- Generation Time: 2026-02-10 22:28:58.8410
-- -------------------------------------------------------------






-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS app_user_id_seq;

-- Table Definition
CREATE TABLE "public"."app_user" (
    "id" int4 NOT NULL DEFAULT nextval('app_user_id_seq'::regclass),
    "email" varchar NOT NULL,
    "password_hash" varchar NOT NULL,
    "role" varchar NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "approved_at" timestamptz,
    PRIMARY KEY ("id")
);

-- Column Comment
COMMENT ON COLUMN "public"."app_user"."approved_at" IS 'Set when admin approves instructor/analyst; NULL = pending';

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS audit_log_log_id_seq;

-- Table Definition
CREATE TABLE "public"."audit_log" (
    "log_id" int4 NOT NULL DEFAULT nextval('audit_log_log_id_seq'::regclass),
    "student_id" int4 NOT NULL,
    "course_id" int4 NOT NULL,
    "old_score" int4,
    "new_score" int4,
    "changed_by" varchar(100),
    "changed_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("log_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."content_item" (
    "content_id" int4 NOT NULL,
    "course_id" int4 NOT NULL,
    "content_type" varchar(30) NOT NULL,
    "title" varchar(150) NOT NULL,
    "url" text,
    PRIMARY KEY ("content_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."course" (
    "course_id" int4 NOT NULL,
    "course_name" varchar(150) NOT NULL,
    "duration_weeks" int4 NOT NULL CHECK (duration_weeks > 0),
    "university_id" int4 NOT NULL,
    "program_id" int4 NOT NULL,
    "textbook_id" int4 NOT NULL,
    "max_capacity" int4 NOT NULL DEFAULT 100,
    "current_enrollment" int4 NOT NULL DEFAULT 0,
    PRIMARY KEY ("course_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS course_proposal_id_seq;

-- Table Definition
CREATE TABLE "public"."course_proposal" (
    "id" int4 NOT NULL DEFAULT nextval('course_proposal_id_seq'::regclass),
    "instructor_id" int4 NOT NULL,
    "course_name" varchar(150) NOT NULL,
    "duration_weeks" int4 NOT NULL,
    "university_id" int4 NOT NULL,
    "program_id" int4 NOT NULL,
    "textbook_id" int4 NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'pending'::character varying CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])),
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."course_topic" (
    "course_id" int4 NOT NULL,
    "topic_id" int4 NOT NULL,
    PRIMARY KEY ("course_id","topic_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."enrollment" (
    "student_id" int4 NOT NULL,
    "course_id" int4 NOT NULL,
    "enroll_date" date NOT NULL,
    "evaluation_score" int4 CHECK ((evaluation_score >= 0) AND (evaluation_score <= 100)),
    "status" varchar(20) NOT NULL DEFAULT 'pending'::character varying,
    PRIMARY KEY ("student_id","course_id")
);

-- Column Comment
COMMENT ON COLUMN "public"."enrollment"."status" IS 'pending | approved | rejected';

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS executive_id_seq;

-- Table Definition
CREATE TABLE "public"."executive" (
    "id" int4 NOT NULL DEFAULT nextval('executive_id_seq'::regclass),
    "app_user_id" int4 NOT NULL,
    "full_name" varchar(100) NOT NULL,
    "executive_type" varchar(20) NOT NULL CHECK ((executive_type)::text = ANY ((ARRAY['admin'::character varying, 'analyst'::character varying])::text[])),
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."instructor" (
    "instructor_id" int4 NOT NULL,
    "full_name" varchar(100) NOT NULL,
    "email" varchar(100),
    "teaching_years" int4,
    "user_id" int4,
    PRIMARY KEY ("instructor_id")
);

-- Column Comment
COMMENT ON COLUMN "public"."instructor"."teaching_years" IS 'Years of teaching experience';

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."program" (
    "program_id" int4 NOT NULL,
    "program_name" varchar(100) NOT NULL,
    "program_type" varchar(50) NOT NULL,
    "duration_weeks_or_months" int4 NOT NULL CHECK (duration_weeks_or_months > 0),
    PRIMARY KEY ("program_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."student" (
    "student_id" int4 NOT NULL,
    "full_name" varchar(100) NOT NULL,
    "age" int4 NOT NULL CHECK ((age >= 13) AND (age <= 100)),
    "country" varchar(50) NOT NULL,
    "category" varchar(50),
    "skill_level" varchar(50),
    "email" varchar(100),
    PRIMARY KEY ("student_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."teaching_assignment" (
    "instructor_id" int4 NOT NULL,
    "course_id" int4 NOT NULL,
    "role" varchar(50),
    PRIMARY KEY ("instructor_id","course_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."textbook" (
    "textbook_id" int4 NOT NULL,
    "title" varchar(150) NOT NULL,
    "isbn" varchar(20),
    "url" text,
    PRIMARY KEY ("textbook_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."topic" (
    "topic_id" int4 NOT NULL,
    "topic_name" varchar(100) NOT NULL,
    PRIMARY KEY ("topic_id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS topic_proposal_id_seq;

-- Table Definition
CREATE TABLE "public"."topic_proposal" (
    "id" int4 NOT NULL DEFAULT nextval('topic_proposal_id_seq'::regclass),
    "instructor_id" int4 NOT NULL,
    "topic_name" varchar(100) NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'pending'::character varying CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])),
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."university" (
    "university_id" int4 NOT NULL,
    "name" varchar(100) NOT NULL,
    "country" varchar(50) NOT NULL,
    PRIMARY KEY ("university_id")
);

;
;


-- Indices
CREATE INDEX ix_app_user_id ON public.app_user USING btree (id);
CREATE UNIQUE INDEX ix_app_user_email ON public.app_user USING btree (email);
ALTER TABLE "public"."content_item" ADD FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE CASCADE;
ALTER TABLE "public"."course" ADD FOREIGN KEY ("program_id") REFERENCES "public"."program"("program_id");
ALTER TABLE "public"."course" ADD FOREIGN KEY ("textbook_id") REFERENCES "public"."textbook"("textbook_id");
ALTER TABLE "public"."course" ADD FOREIGN KEY ("university_id") REFERENCES "public"."university"("university_id");


-- Indices
CREATE UNIQUE INDEX course_course_name_key ON public.course USING btree (course_name);
CREATE INDEX idx_course_duration ON public.course USING btree (duration_weeks);
ALTER TABLE "public"."course_proposal" ADD FOREIGN KEY ("university_id") REFERENCES "public"."university"("university_id");
ALTER TABLE "public"."course_proposal" ADD FOREIGN KEY ("textbook_id") REFERENCES "public"."textbook"("textbook_id");
ALTER TABLE "public"."course_proposal" ADD FOREIGN KEY ("program_id") REFERENCES "public"."program"("program_id");
ALTER TABLE "public"."course_proposal" ADD FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("instructor_id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_course_proposal_status ON public.course_proposal USING btree (status);
CREATE INDEX idx_course_proposal_instructor ON public.course_proposal USING btree (instructor_id);
ALTER TABLE "public"."course_topic" ADD FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("topic_id") ON DELETE CASCADE;
ALTER TABLE "public"."course_topic" ADD FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE CASCADE;
ALTER TABLE "public"."enrollment" ADD FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE;
ALTER TABLE "public"."enrollment" ADD FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_enrollment_stats ON public.enrollment USING btree (course_id, evaluation_score);
CREATE INDEX idx_enrollment_score ON public.enrollment USING btree (evaluation_score);
ALTER TABLE "public"."executive" ADD FOREIGN KEY ("app_user_id") REFERENCES "public"."app_user"("id") ON DELETE CASCADE;


-- Comments
COMMENT ON TABLE "public"."executive" IS 'Admin and analyst users; stores full_name linked to app_user';


-- Indices
CREATE UNIQUE INDEX executive_app_user_id_key ON public.executive USING btree (app_user_id);
CREATE INDEX idx_executive_app_user_id ON public.executive USING btree (app_user_id);
CREATE INDEX idx_executive_type ON public.executive USING btree (executive_type);
ALTER TABLE "public"."instructor" ADD FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX instructor_email_key ON public.instructor USING btree (email);
CREATE INDEX idx_instructor_user_id ON public.instructor USING btree (user_id);


-- Indices
CREATE UNIQUE INDEX student_email_key ON public.student USING btree (email);
CREATE INDEX idx_student_country ON public.student USING btree (country);
ALTER TABLE "public"."teaching_assignment" ADD FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE CASCADE;
ALTER TABLE "public"."teaching_assignment" ADD FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("instructor_id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX textbook_isbn_key ON public.textbook USING btree (isbn);


-- Indices
CREATE UNIQUE INDEX topic_topic_name_key ON public.topic USING btree (topic_name);
ALTER TABLE "public"."topic_proposal" ADD FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("instructor_id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_topic_proposal_status ON public.topic_proposal USING btree (status);
CREATE INDEX idx_topic_proposal_instructor ON public.topic_proposal USING btree (instructor_id);


-- Indices
CREATE UNIQUE INDEX university_name_key ON public.university USING btree (name);
