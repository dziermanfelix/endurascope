import { Module } from '@nestjs/common';
import { TrainingBlocksService } from './training-blocks.service';
import { TrainingBlocksController } from './training-blocks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrainingBlocksController],
  providers: [TrainingBlocksService],
  exports: [TrainingBlocksService],
})
export class TrainingBlocksModule {}
