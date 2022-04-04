import { Body, Controller, Post } from '@nestjs/common';

import { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model';
import { exportCode } from './2-create-ts-compiler';

@Controller('code')
export class CodeController {
  @Post('export')
  async exportCode(@Body() figmaNode: ExportCodePayload, skipCsbUpload = false) {
    return exportCode(figmaNode, skipCsbUpload);
  }
}
