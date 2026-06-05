import { Module } from '@nestjs/common';
import { TrainingBlocksService } from './training-blocks.service';
import { TrainingBlocksController } from './training-blocks.controller';
import { TrainingBlockPlanService } from './training-block-plan.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrainingBlocksController],
  providers: [TrainingBlocksService, TrainingBlockPlanService],
  exports: [TrainingBlocksService, TrainingBlockPlanService],
})
export class TrainingBlocksModule {}
