import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedShape {
  data: unknown;
  meta: unknown;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }

        if (isPaginatedResponse(data)) {
          return { success: true, ...data };
        }
        return { success: true, data };
      })
    );
  }
}

const isPaginatedResponse = (data: unknown): data is PaginatedShape => {
  return !!data && typeof data === 'object' && 'data' in data && 'meta' in data;
};
