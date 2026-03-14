import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';

/** All ImageKit folders must be rooted under wirdi-assets/ */
export type ImageKitFolder = `wirdi-assets/${`groups/${string}`}`;

export function FolderInterceptor(folder: (req: Request) => ImageKitFolder) {
  @Injectable()
  class Interceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler) {
      const req = ctx.switchToHttp().getRequest<Request>();
      req.folder = typeof folder === 'function' ? folder(req) : folder;
      return next.handle();
    }
  }

  return Interceptor;
}
