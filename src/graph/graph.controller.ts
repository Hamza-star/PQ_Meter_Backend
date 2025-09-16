import { Controller, Get, Query } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('latest')
  async getLatest(@Query('channel') channel: string): Promise<any> {
    return this.graphService.getLatestChannelData(channel);
  }
}
