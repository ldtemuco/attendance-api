// attendance-api/src/queries/admin/students.queries.ts

export const ST_GET_STUDENTS =
`
    SELECT
        id,
        student_code AS studentCode,

        first_names AS firstNames,
        paternal_last_name AS paternalLastName,
        maternal_last_name AS maternalLastName,

        state,

        created_at AS createdAt,
        updated_at AS updatedAt

    FROM students

    ORDER BY
        paternal_last_name,
        maternal_last_name,
        first_names
`;


export const ST_GET_STUDENT =
`
    SELECT
        id,
        student_code AS studentCode,

        first_names AS firstNames,
        paternal_last_name AS paternalLastName,
        maternal_last_name AS maternalLastName,

        state,

        created_at AS createdAt,
        updated_at AS updatedAt

    FROM students

    WHERE id = ?

    LIMIT 1
`;

export const ST_CHECK_STUDENT_CODE =
`
    SELECT id

    FROM students

    WHERE student_code = ?

    LIMIT 1
`;

export const ST_CREATE_STUDENT =
`
    INSERT INTO students
    (
        student_code,
        first_names,
        paternal_last_name,
        maternal_last_name,
        state
    )
    VALUES (?, ?, ?, ?, 'ACTIVE')
`;

export const ST_UPDATE_STUDENT =
`
    UPDATE students

    SET
        first_names = ?,
        paternal_last_name = ?,
        maternal_last_name = ?,
        state = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
`;