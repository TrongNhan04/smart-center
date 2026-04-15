// export class PendingSSDTO {
//     request: RequestUnlockDTO[]
//     unSubmitted: UnsubmittedDTO[]
// }

import { IsNotEmpty } from "class-validator"

export class RequestUnlockDTO {
    id!: number
    lesson!: number
    room!: string
    teacher!: string
    reason!: string
    date!: Date
}

export class UnsubmittedDTO {
    id!: number
    lesson!: number
    room!: string
    teacher!: string
}

export class RemindTeacher {
    @IsNotEmpty()
    classId!: number

    @IsNotEmpty()
    sessionId!:number
}
