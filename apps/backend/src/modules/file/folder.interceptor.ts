import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';

/** All ImageKit folders must be rooted under wirdi-assets/ */
export type ImageKitFolder = `wirdi-assets/${'staging/' | 'development/' | ''}groups/${string}`;

/**
 * Builds an environment-scoped ImageKit folder path for a group.
 * Non-production envs are isolated under `wirdi-assets/<NODE_ENV>/groups/<id>/`
 * to prevent staging/dev uploads from colliding with production assets.
 */
const _envSegment =
  process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? `${process.env.NODE_ENV.toLowerCase()}/`
    : '';

export function groupFolder(groupId: string): ImageKitFolder {
  return `wirdi-assets/${_envSegment}groups/${groupId}` as ImageKitFolder;
}

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
