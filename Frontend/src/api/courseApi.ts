import axiosClient from "../components/AxiosClient"

export const createCourseApi = (course:any) => {
    return axiosClient.post('/admin/courses', course)
}

export const listCoureApi = () => {
    return axiosClient.get('/admin/courses')
}