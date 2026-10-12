-- =========================================================
-- ATTENDANCE DATABASE
-- Initial schema
-- =========================================================


-- =========================================================
-- ACADEMIC YEARS
-- =========================================================

CREATE TABLE academic_years (
    id          INTEGER PRIMARY KEY,
    year        INTEGER NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'CLOSED')),
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at   TEXT
) STRICT;


-- =========================================================
-- COURSES
-- =========================================================

CREATE TABLE courses (
    id                INTEGER PRIMARY KEY,
    academic_year_id  INTEGER NOT NULL,
    level             INTEGER NOT NULL,
    letter            TEXT NOT NULL,
    name              TEXT NOT NULL,
    state             TEXT NOT NULL DEFAULT 'ACTIVE'
                      CHECK (state IN ('ACTIVE', 'INACTIVE')),
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON DELETE RESTRICT,

    UNIQUE (academic_year_id, level, letter)
) STRICT;


-- =========================================================
-- STUDENTS
-- =========================================================

CREATE TABLE students (
    id                  INTEGER PRIMARY KEY,
    student_code        INTEGER NOT NULL UNIQUE,
    first_names         TEXT NOT NULL,
    paternal_last_name  TEXT NOT NULL,
    maternal_last_name  TEXT,
    state               TEXT NOT NULL DEFAULT 'ACTIVE'
                        CHECK (state IN ('ACTIVE', 'INACTIVE')),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;


-- =========================================================
-- ENROLLMENTS
-- =========================================================

CREATE TABLE enrollments (
    id              INTEGER PRIMARY KEY,
    student_id      INTEGER NOT NULL,
    course_id       INTEGER NOT NULL,
    number          INTEGER,
    date_entry      TEXT,
    date_discharge  TEXT,
    state           TEXT NOT NULL DEFAULT 'ACTIVE'
                    CHECK (state IN ('ACTIVE', 'INACTIVE')),
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE RESTRICT,

    UNIQUE (student_id, course_id),
    UNIQUE (course_id, number)
) STRICT;


-- =========================================================
-- STAFF
-- =========================================================

CREATE TABLE staff (
    id                  INTEGER PRIMARY KEY,
    first_names         TEXT NOT NULL,
    paternal_last_name  TEXT NOT NULL,
    maternal_last_name  TEXT,
    state               TEXT NOT NULL DEFAULT 'ACTIVE'
                        CHECK (state IN ('ACTIVE', 'INACTIVE')),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;


-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE roles (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL UNIQUE,
    description  TEXT
) STRICT;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id             INTEGER PRIMARY KEY,
    staff_id       INTEGER NOT NULL UNIQUE,
    role_id        INTEGER NOT NULL,
    username       TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    active         INTEGER NOT NULL DEFAULT 1
                   CHECK (active IN (0, 1)),
    last_access    TEXT,
    created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
) STRICT;


-- =========================================================
-- COURSE PERMISSIONS
-- =========================================================

CREATE TABLE permissions (
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    course_id   INTEGER NOT NULL,

    can_read    INTEGER NOT NULL DEFAULT 1
                CHECK (can_read IN (0, 1)),

    can_write   INTEGER NOT NULL DEFAULT 0
                CHECK (can_write IN (0, 1)),

    can_edit    INTEGER NOT NULL DEFAULT 0
                CHECK (can_edit IN (0, 1)),

    can_delete  INTEGER NOT NULL DEFAULT 0
                CHECK (can_delete IN (0, 1)),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    UNIQUE (user_id, course_id)
) STRICT;


-- =========================================================
-- MONTHLY ATTENDANCE PERIODS
-- =========================================================

CREATE TABLE attendance_periods (
    id          INTEGER PRIMARY KEY,
    course_id   INTEGER NOT NULL,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL
                CHECK (month BETWEEN 1 AND 12),

    date_start  TEXT NOT NULL,
    date_end    TEXT NOT NULL,

    state       TEXT NOT NULL DEFAULT 'OPEN'
                CHECK (state IN ('OPEN', 'CLOSED')),

    closed_by   INTEGER,
    closed_at   TEXT,

    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (closed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    UNIQUE (course_id, year, month)
) STRICT;


-- =========================================================
-- ATTENDANCE
-- =========================================================

CREATE TABLE attendances (
    id                    INTEGER PRIMARY KEY,
    attendance_period_id  INTEGER NOT NULL,
    enrollment_id         INTEGER NOT NULL,
    date                  TEXT NOT NULL,

    status                TEXT NOT NULL
                          CHECK (
                              status IN (
                                  'PRESENT',
                                  'ABSENT',
                                  'LATE',
                                  'EXCUSED'
                              )
                          ),

    observations          TEXT,

    registered_by         INTEGER,

    created_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (attendance_period_id)
        REFERENCES attendance_periods(id)
        ON DELETE CASCADE,

    FOREIGN KEY (enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (registered_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    UNIQUE (enrollment_id, date)
) STRICT;


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_courses_academic_year
    ON courses(academic_year_id);

CREATE INDEX idx_enrollments_student
    ON enrollments(student_id);

CREATE INDEX idx_enrollments_course
    ON enrollments(course_id);

CREATE INDEX idx_users_role
    ON users(role_id);

CREATE INDEX idx_permissions_course
    ON permissions(course_id);

CREATE INDEX idx_attendance_periods_course
    ON attendance_periods(course_id);

CREATE INDEX idx_attendance_periods_state
    ON attendance_periods(state);

CREATE INDEX idx_attendances_period_date
    ON attendances(attendance_period_id, date);

CREATE INDEX idx_attendances_registered_by
    ON attendances(registered_by);
