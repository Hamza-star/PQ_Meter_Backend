import { Controller, Get, Query } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('harmonics')
  async getOddHarmonics(@Query('channel') channel: string) {
    if (!channel || !['V1', 'V2', 'V3', 'I1', 'I2', 'I3'].includes(channel)) {
      return { error: 'Invalid channel. Use V1, V2, V3, I1, I2, I3' };
    }
    return this.graphService.getOddHarmonicsStats(channel);
  }

  @Get('latest')
  async getLatest(@Query('thd') channel: string): Promise<any> {
    return this.graphService.getLatestChannelData(channel);
  }
}
