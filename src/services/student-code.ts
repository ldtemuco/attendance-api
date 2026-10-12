import
{
    MIN_STUDENT_CODE,
    MAX_STUDENT_CODE,
    STUDENT_CODE_GENERATION_ATTEMPTS
}
from "../config/student.config";
//--------------------------------------------------------------------------------------------------
import
{
    ST_CHECK_STUDENT_CODE
}
from "../queries/admin/students.queries";
//--------------------------------------------------------------------------------------------------


function randomStudentCode(): number
{
    const values =
        new Uint32Array(1);

    crypto.getRandomValues(values);


    const range =
        MAX_STUDENT_CODE -
        MIN_STUDENT_CODE + 1;


    return MIN_STUDENT_CODE +
        (values[0] % range);
}


export async function generateStudentCode(
    db: D1Database
): Promise<number | null>
{
    for (
        let attempt = 0;
        attempt < STUDENT_CODE_GENERATION_ATTEMPTS;
        attempt++
    )
    {
        const studentCode =
            randomStudentCode();


        const existing = await db
            .prepare(ST_CHECK_STUDENT_CODE)
            .bind(studentCode)
            .first<{ id: number }>();


        if (!existing)
        {
            return studentCode;
        }
    }


    return null;
}