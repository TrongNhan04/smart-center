import axiosClient from "../components/AxiosClient";
import type { EnrollDto } from "../components/enroll/EnrollDTO";

export const enrollApi = {
    findMany: (q: string, status?: string) => {
        const params: { q: string, status?: string } = { q } // {q:q}
        if (status)
            params.status = status

        return axiosClient.get(`admin/enrolls`, {
            params: params
        })
    },

    create:(body:EnrollDto) =>
        axiosClient.post(`admin/enrolls`,body),

    delete: (enrollId:number) => 
        axiosClient.patch(`admin/enrolls/${enrollId}/inactive`)
}

