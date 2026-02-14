import axiosClient from "../components/AxiosClient";

export const sessionApi = {
    getSessionOfClass: (classId:number) =>
        axiosClient.get(`admin/classes/${classId}/sessions`)
}