// attendance-api/src/queries/admin/permissions.queries.ts

export const ST_GET_USER_ROLE =
`
    SELECT
        u.id,
        r.name AS role

    FROM users AS u

    INNER JOIN roles AS r
        ON r.id = u.role_id

    WHERE u.id = ?

    LIMIT 1
`;


export const ST_DELETE_USER_PERMISSIONS =
`
    DELETE FROM permissions
    WHERE user_id = ?
`;


export const ST_CREATE_PERMISSION =
`
    INSERT INTO permissions
    (
        user_id,
        course_id,
        can_read,
        can_write,
        can_edit,
        can_delete
    )
    VALUES (?, ?, ?, ?, ?, ?)
`;

export const ST_GET_USER_PERMISSIONS =
`
    SELECT
        p.course_id AS courseId,

        c.level,
        c.letter,
        c.name,

        p.can_read AS canRead,
        p.can_write AS canWrite,
        p.can_edit AS canEdit,
        p.can_delete AS canDelete

    FROM permissions AS p

    INNER JOIN courses AS c
        ON c.id = p.course_id

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE p.user_id = ?
      AND ay.status = 'ACTIVE'
      AND c.state = 'ACTIVE'

    ORDER BY
        c.level,
        c.letter
`;


export function getActiveCoursesStatement(count: number): string
{
    const placeholders = Array(count).fill("?").join(", ");
    return `
        SELECT c.id

        FROM courses AS c

        INNER JOIN academic_years AS ay
            ON ay.id = c.academic_year_id

        WHERE c.id IN (${placeholders})
          AND c.state = 'ACTIVE'
          AND ay.status = 'ACTIVE'
    `;
}
