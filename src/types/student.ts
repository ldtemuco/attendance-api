export interface AdminStudentRecord
{
    id: number;
    studentCode: number;

    firstNames: string;
    paternalLastName: string;
    maternalLastName: string | null;

    state: string;

    createdAt: string;
    updatedAt: string;
}


export interface CreateStudentRequest
{
    firstNames: string;
    paternalLastName: string;
    maternalLastName?: string;
}


export interface UpdateStudentRequest
{
    firstNames: string;
    paternalLastName: string;
    maternalLastName?: string;

    active: boolean;
}