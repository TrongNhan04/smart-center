// export class PendingSSDTO {
//     request: RequestUnlockDTO[]
//     unSubmitted: UnsubmittedDTO[]
// }

export class RequestUnlockDTO {
    id: number
    lesson: number
    room: string
    teacher: string
    reason: string
    date: Date
}

export class UnsubmittedDTO {
    id: number
    lesson: number
    room: string
    teacher: string
}

export interface PendingSSDTO {
    rquestUnlock: {
        id: number
        lesson: number
        room: string
        teacher: string
        reason: string
        date: Date
    }[],

    unSubmitted: {
        id: number
        lesson: number
        room: string
        teacher: string
    }
}