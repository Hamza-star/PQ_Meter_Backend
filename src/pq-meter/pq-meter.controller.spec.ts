import { Test, TestingModule } from '@nestjs/testing';
import { PqMeterController } from './pq-meter.controller';
import { PqMeterService } from './pq-meter.service';

describe('PqMeterController', () => {
  let controller: PqMeterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PqMeterController],
      providers: [PqMeterService],
    }).compile();

    controller = module.get<PqMeterController>(PqMeterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
