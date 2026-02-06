import axiosClient from "../components/AxiosClient"
import type { ClassDB } from "../components/class/ClassInterface"

const classApi = {
    getClassesOfCourse: (courseId: number) => {
        return axiosClient.get(`/admin/courses/${courseId}/classes`)
    }
}

export default classApi