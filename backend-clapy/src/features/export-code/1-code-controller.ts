import { Body, Controller, Post } from '@nestjs/common';

import type { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { exportCode } from './2-create-ts-compiler.js';

@Controller('code')
export class CodeController {
  @Post('export')
  async exportCode(@Body() figmaNode: ExportCodePayload, uploadToCsb = true) {
    return exportCode(figmaNode, uploadToCsb);
  }
}
