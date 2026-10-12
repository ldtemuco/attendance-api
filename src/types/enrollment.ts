export interface AdminEnrollmentRecord
{
    id: number;
    studentId: number;
    studentCode: number;
    firstNames: string;
    paternalLastName: string;
    maternalLastName: string | null;
    studentState: string;
    courseId: number;
    courseName: string;
    courseState: string;
    academicYearId: number;
    academicYearStatus: string;
    year: number;
    number: number | null;
    dateEntry: string | null;
    dateDischarge: string | null;
    state: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
}

export interface CreateEnrollmentRequest
{
    studentId: number;
    courseId: number;
    number?: number | null;
    dateEntry?: string | null;
}

export interface UpdateEnrollmentRequest
{
    active: boolean;
    number?: number | null;
    dateEntry?: string | null;
    dateDischarge?: string | null;
}

export interface EnrollmentCourseRecord
{
    id: number;
    academicYearId: number;
    year: number;
}
