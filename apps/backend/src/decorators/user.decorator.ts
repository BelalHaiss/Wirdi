import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Express.Request>();
  if (data) return request.user![data as keyof typeof request.user];
  return request.user;
});
