import { Test, TestingModule } from '@nestjs/testing';
import { PqMeterService } from './pq-meter.service';

describe('PqMeterService', () => {
  let service: PqMeterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PqMeterService],
    }).compile();

    service = module.get<PqMeterService>(PqMeterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
