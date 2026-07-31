import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import express from 'express';

export interface ActiveUserData {
    userId: number;
    email: string;
    role?: string;
    tokenVersion?: number;
}

export const User = createParamDecorator((
    field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user: ActiveUserData = request.user
    // Nếu truyền param (vd: @User('userId')) -> chỉ trả về thuộc tính đó
    // Nếu không truyền -> trả về toàn bộ object user
    return field ? user?.[field] : user
})