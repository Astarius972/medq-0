-- =============================================
-- Supabase SQL schema — Анги платформ
-- Supabase dashboard > SQL Editor дээр ажиллуулна
-- =============================================

create table if not exists teachers (
  gmail             text primary key,
  name              text,
  password          text,
  code              text,
  code_created_at   timestamptz
);

create table if not exists students (
  gmail             text not null,
  code              text not null,
  personal_code     text unique,
  grade             integer,
  teacher_gmail     text references teachers(gmail),
  last_name         text,
  first_name        text,
  joined_at         timestamptz default now(),
  primary key (gmail, code)
);

create table if not exists parents (
  gmail                   text not null,
  student_personal_code   text not null,
  student_gmail           text,
  teacher_gmail           text,
  teacher_name            text,
  joined_at               timestamptz default now(),
  primary key (gmail, student_personal_code)
);

create table if not exists assignments (
  id              uuid primary key default gen_random_uuid(),
  teacher_gmail   text references teachers(gmail),
  grade           integer,
  title           text,
  description     text,
  deadline        timestamptz,
  points          integer default 100,
  created_at      timestamptz default now()
);

create table if not exists submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid references assignments(id),
  student_gmail   text,
  text            text,
  file_path       text,
  submitted_at    timestamptz default now(),
  score           integer,
  graded_at       timestamptz,
  unique (assignment_id, student_gmail)
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  from_gmail  text,
  to_gmail    text,
  text        text,
  sent_at     timestamptz default now()
);

-- =============================================
-- Storage bucket (Supabase dashboard > Storage дээр хийх)
-- "uploads" нэртэй Public bucket үүсгэнэ
-- =============================================
