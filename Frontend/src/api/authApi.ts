import axiosClient from "../components/AxiosClient"

export const loginApi = (data: any) => {
    return axiosClient.post('/auth/login', data)
}