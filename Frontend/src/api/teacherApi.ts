import axiosClient from "../components/AxiosClient";

const teacherApi = {
    findMany: () => axiosClient.get('/admin/teachers')
}
export default teacherApi