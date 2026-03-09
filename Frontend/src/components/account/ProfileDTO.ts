interface Profile{
    userName: string,
    oldPw: string,
    newPw:string,
    email:string,
    phone: string
}

export type UpdateProfile = Partial<Profile>