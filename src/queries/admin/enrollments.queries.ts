// Matrículas se mantienen para fines históricos, incluso después del egreso.
const ST_ENROLLMENT_COLUMNS =
`
    SELECT
        e.id,
        e.student_id AS studentId,
        s.student_code AS studentCode,
        s.first_names AS firstNames,
        s.paternal_last_name AS paternalLastName,
        s.maternal_last_name AS maternalLastName,
        s.state AS studentState,
        e.course_id AS courseId,
        c.name AS courseName,
        c.state AS courseState,
        c.academic_year_id AS academicYearId,
        ay.status AS academicYearStatus,
        ay.year,
        e.number,
        e.date_entry AS dateEntry,
        e.date_discharge AS dateDischarge,
        e.state,
        e.created_at AS createdAt,
        e.updated_at AS updatedAt

    FROM enrollments AS e

    INNER JOIN students AS s
        ON s.id = e.student_id

    INNER JOIN courses AS c
        ON c.id = e.course_id

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id
`;

export const ST_GET_ADMIN_ENROLLMENTS =
`
    ${ST_ENROLLMENT_COLUMNS}

    WHERE ay.year = ?
      AND (? IS NULL OR e.course_id = ?)
      AND (? IS NULL OR e.student_id = ?)
      AND (? IS NULL OR e.state = ?)

    ORDER BY
        c.level,
        c.letter,
        e.number IS NULL,
        e.number,
        s.paternal_last_name,
        s.maternal_last_name,
        s.first_names
`;

export const ST_GET_ADMIN_ENROLLMENT =
`
    ${ST_ENROLLMENT_COLUMNS}

    WHERE e.id = ?

    LIMIT 1
`;

export const ST_GET_ACTIVE_ACADEMIC_YEAR_ENROLLMENTS =
`
    SELECT id, year

    FROM academic_years

    WHERE status = 'ACTIVE'

    ORDER BY year DESC

    LIMIT 1
`;

export const ST_GET_ENROLLABLE_COURSE =
`
    SELECT
        c.id,
        c.academic_year_id AS academicYearId,
        ay.year

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE c.id = ?
      AND c.state = 'ACTIVE'
      AND ay.status = 'ACTIVE'

    LIMIT 1
`;

export const ST_GET_ACTIVE_STUDENT_FOR_ENROLLMENT =
`
    SELECT id

    FROM students

    WHERE id = ?
      AND state = 'ACTIVE'

    LIMIT 1
`;

export const ST_CHECK_STUDENT_ENROLLMENT =
`
    SELECT id

    FROM enrollments

    WHERE student_id = ?
      AND course_id = ?

    LIMIT 1
`;

export const ST_CHECK_ACTIVE_YEAR_ENROLLMENT =
`
    SELECT e.id

    FROM enrollments AS e

    INNER JOIN courses AS c
        ON c.id = e.course_id

    WHERE e.student_id = ?
      AND c.academic_year_id = ?
      AND e.state = 'ACTIVE'
      AND (? IS NULL OR e.id <> ?)

    LIMIT 1
`;

export const ST_CHECK_ENROLLMENT_NUMBER =
`
    SELECT id

    FROM enrollments

    WHERE course_id = ?
      AND number = ?
      AND (? IS NULL OR id <> ?)

    LIMIT 1
`;

export const ST_CREATE_ENROLLMENT =
`
    INSERT INTO enrollments
    (
        student_id,
        course_id,
        number,
        date_entry,
        state
    )
    VALUES (?, ?, ?, ?, 'ACTIVE')
`;

export const ST_UPDATE_ENROLLMENT =
`
    UPDATE enrollments

    SET
        number = ?,
        date_entry = ?,
        date_discharge = ?,
        state = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
`;
