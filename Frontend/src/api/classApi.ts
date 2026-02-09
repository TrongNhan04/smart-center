import axiosClient from "../components/AxiosClient"

const classApi = {
    getClassesOfCourse: (courseId: number) => {
        return axiosClient.get(`/admin/courses/${courseId}/classes`)
    }
}

export default classApi