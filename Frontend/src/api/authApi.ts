import axiosClient from "../components/AxiosClient"

interface login{
    email:string, pw:string
}

export const loginApi = (data: login) => {
    return axiosClient.post('/auth/login', data)
}