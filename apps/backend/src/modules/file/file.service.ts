import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { imageKitToken } from './imagekit.provider';
import ImageKit, { toFile } from '@imagekit/nodejs';
import { StorageEngine } from 'multer';

@Injectable()
export class FileService {
  constructor(@Inject(imageKitToken) private imagekit: ImageKit) {}

  imageKitMulterStorage() {
    const imageKitStorage: StorageEngine = {
      _handleFile: (req, file, cb) => {
        const folder = req.folder;
        if (!folder) {
          return cb(
            new InternalServerErrorException(
              'req.folder is not set — use FolderInterceptor before FileInterceptor'
            )
          );
        }
        toFile(file.stream)
          .then((fileData) =>
            this.imagekit.files
              .upload({
                file: fileData,
                fileName: file.originalname,
                folder,
                useUniqueFileName: true,
              })
              .then((res) => {
                cb(null, res);
              })
          )
          .catch(cb);
      },
      _removeFile: (req, file, cb) => {
        if (!file.fileId) return cb(null);
        console.log('_removeFile of custom multer imagekit storage triggered ');
        this.deleteFileFromImageKit(file.fileId)
          .then(() => cb(null))
          .catch(cb);
      },
    };
    return imageKitStorage;
  }

  deleteFileFromImageKit(fileId: string) {
    return this.imagekit.files.delete(fileId);
  }
}
