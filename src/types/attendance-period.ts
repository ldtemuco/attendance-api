export type AttendancePeriodState = "OPEN" | "CLOSED";

export interface AttendancePeriodRecord
{
    id: number;
    courseId: number;
    courseName: string;
    courseState: string;
    year: number;
    academicYearStatus: string;
    month: number;
    dateStart: string;
    dateEnd: string;
    state: AttendancePeriodState;
    closedBy: number | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    attendanceCount: number;
}

export interface PeriodCourseRecord
{
    id: number;
    year: number;
}

export interface CreateAttendancePeriodRequest
{
    courseId: number;
    month: number;
    dateStart?: string;
    dateEnd?: string;
}

export interface UpdateAttendancePeriodRequest
{
    dateStart?: string;
    dateEnd?: string;
}
