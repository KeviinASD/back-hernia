import { Module } from '@nestjs/common';
import { DetectionService } from './services/detection.service';
import { DetectionController } from './controllers/detection.controller';

@Module({
  controllers: [DetectionController],
  providers: [DetectionService],
})
export class DetectionModule {}
