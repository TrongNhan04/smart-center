import type { UpdateProfile } from "../components/account/ProfileDTO"
import axiosClient from "../components/AxiosClient"

interface login {
    email: string, pw: string
}

export const authApi = {
    login: (body: login) => axiosClient.post('auth/login', body),

    logout: () => axiosClient.post('auth/logout'),

    update: (body: UpdateProfile) =>
        axiosClient.patch(`auth/profile`, body)
}
