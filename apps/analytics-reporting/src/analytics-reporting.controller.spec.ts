import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsReportingController } from './analytics-reporting.controller';
import { AnalyticsReportingService } from './analytics-reporting.service';

describe('AnalyticsReportingController', () => {
  let analyticsReportingController: AnalyticsReportingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsReportingController],
      providers: [AnalyticsReportingService],
    }).compile();

    analyticsReportingController = app.get<AnalyticsReportingController>(AnalyticsReportingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(analyticsReportingController.getHello()).toBe('Hello World!');
    });
  });
});
