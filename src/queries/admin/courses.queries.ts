
export const ST_GET_ACTIVE_ACADEMIC_YEAR =
`
    SELECT
        id,
        year

    FROM academic_years

    WHERE status = 'ACTIVE'

    LIMIT 1
`;

export const ST_GET_ADMIN_COURSES =
`
    SELECT
        c.id,
        c.academic_year_id AS academicYearId,

        ay.year,

        c.level,
        c.letter,
        c.name,
        c.state

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE ay.status = 'ACTIVE'

    ORDER BY
        c.level,
        c.letter
`;

export const ST_GET_COURSE =
`
    SELECT
        c.id,
        c.academic_year_id AS academicYearId,

        ay.year,

        c.level,
        c.letter,
        c.name,
        c.state

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE c.id = ?
      AND ay.status = 'ACTIVE'

    LIMIT 1
`;

export const ST_CHECK_COURSE =
`
    SELECT id

    FROM courses

    WHERE academic_year_id = ?
      AND level = ?
      AND letter = ?

    LIMIT 1
`;


export const ST_CHECK_COURSE_EXCEPT_ID =
`
    SELECT id

    FROM courses

    WHERE academic_year_id = ?
      AND level = ?
      AND letter = ?
      AND id <> ?

    LIMIT 1
`;


export const ST_CREATE_COURSE =
`
    INSERT INTO courses
    (
        academic_year_id,
        level,
        letter,
        name,
        state
    )
    VALUES (?, ?, ?, ?, 'ACTIVE')
`;


export const ST_UPDATE_COURSE =
`
    UPDATE courses

    SET
        level = ?,
        letter = ?,
        name = ?,
        state = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
`;