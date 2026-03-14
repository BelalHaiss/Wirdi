import ImageKit from '@imagekit/nodejs';
import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVariables } from 'src/types/declartion-merging';

export const imageKitToken = 'ImageKitProvider';
export const ImageKitProvider: FactoryProvider = {
  provide: imageKitToken,
  useFactory: (configService: ConfigService<EnvVariables>) => {
    return new ImageKit({
      privateKey: configService.getOrThrow('IMAGEKIT_SECRET_KEY'),
    });
  },
  inject: [ConfigService],
};
