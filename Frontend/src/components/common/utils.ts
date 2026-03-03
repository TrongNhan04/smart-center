import { isEqual } from 'lodash';

//T extends Record<string, any>: T là 1 object bất kỳ
export const getChangedValue = <T extends Record<string, any>>
    (originData: T, newData: T) => {

    // change là T nhưng không bắt buộc có đủ các phần tử
    const changes: Partial<T> = {}
    Object.keys(originData).forEach((key) => {
        // k là key của T
        const k = key as keyof T
        if (!isEqual(originData[key], newData[key]))
        {
            console.log('key:', originData[key])
            changes[k] = newData[key]
        }
    })
    return changes
}