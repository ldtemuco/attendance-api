export interface LoginRequest 
{
    username: string;
    password: string;
}

export interface UserRecord 
{
    id: number;
    username: string;
    password_hash: string;
    active: number;
    first_names: string;
    paternal_last_name: string;
    maternal_last_name: string | null;
    role: string;
}