export interface CourseRecord 
{
    id: number;
    level: number;
    letter: string;
    name: string;
    can_read?: number;
    can_write?: number;
    can_edit?: number;
    can_delete?: number;
}

export interface AdminCourseRecord
{
    id: number;
    academicYearId: number;
    year: number;
    level: number;
    letter: string;
    name: string;
    state: string;
}


export interface CreateCourseRequest
{
    level: number;
    letter: string;
}


export interface UpdateCourseRequest
{
    level: number;
    letter: string;
    active: boolean;
}


export interface AcademicYearRecord
{
    id: number;
    year: number;
}