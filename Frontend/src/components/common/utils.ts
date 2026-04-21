/**
 *  T extends Record<string, any>: T là 1 object bất kỳ
 *  originData: T | originData là 1 object kiểu T
 *  newData: T | newData là 1 object kiểu T
 *  trả về changes cũng là 1 object kiểu T
 */

import { isEqual } from 'lodash';

export const getChangedValue = <T extends Record<string, any>>
    (originData: T, newData: T) => {
    const changes: Partial<T> = {} // dùng Partial để các thuộc tính có thể optional
    Object.keys(originData).forEach((key) => {
        // xem k là key của T
        const k = key as keyof T
        if (!isEqual(originData[key], newData[key]))
        {
            console.log('key thay đổi: ', key)
            changes[k] = newData[key]
        }
    })
    return changes
}