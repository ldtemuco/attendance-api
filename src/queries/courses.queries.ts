// attendance-api/src/queries/courses.queries.ts

export const ST_GET_COURSES = 
`
    SELECT
        c.id,
        c.level,
        c.letter,
        c.name

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE ay.status = 'ACTIVE'
        AND c.state = 'ACTIVE'

    ORDER BY
        c.level,
        c.letter
`;

export const ST_GET_ACCESSIBLE_COURSES =
`
    SELECT
        c.id,
        c.level,
        c.letter,
        c.name,

        p.can_read,
        p.can_write,
        p.can_edit,
        p.can_delete

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    INNER JOIN permissions AS p
        ON p.course_id = c.id

    WHERE ay.status = 'ACTIVE'
        AND c.state = 'ACTIVE'
        AND p.user_id = ?
        AND p.can_read = 1

    ORDER BY
        c.level,
        c.letter
`;
