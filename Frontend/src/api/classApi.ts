import axiosClient from "../components/AxiosClient"
import type { ClassDto } from "../components/class/ClassInterface"

const classApi = {
    getClassesOfCourse: (courseId: number) =>
        axiosClient.get(`/admin/courses/${courseId}/classes`)
    ,

    create: (body: ClassDto) => 
        axiosClient.post(`/admin/classes`,body)
}

export default classApi