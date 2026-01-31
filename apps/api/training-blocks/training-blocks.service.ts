import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingBlockDto, UpdateTrainingBlockDto } from './dto/training-block.dto';

@Injectable()
export class TrainingBlocksService {
  constructor(private prisma: PrismaService) {}

  async create(createTrainingBlockDto: CreateTrainingBlockDto) {
    const raceDate =
      createTrainingBlockDto.raceDate instanceof Date
        ? createTrainingBlockDto.raceDate
        : new Date(createTrainingBlockDto.raceDate);
    const startDate =
      createTrainingBlockDto.startDate instanceof Date
        ? createTrainingBlockDto.startDate
        : new Date(createTrainingBlockDto.startDate);

    const durationWeeks = Math.ceil(
      (raceDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    const data = {
      ...createTrainingBlockDto,
      raceDate,
      startDate,
      durationWeeks,
    };

    return this.prisma.trainingBlock.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.trainingBlock.findMany({
      orderBy: {
        raceDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.trainingBlock.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateTrainingBlockDto: UpdateTrainingBlockDto) {
    const data: Record<string, unknown> = { ...updateTrainingBlockDto };

    if (updateTrainingBlockDto.raceDate) {
      data.raceDate =
        updateTrainingBlockDto.raceDate instanceof Date
          ? updateTrainingBlockDto.raceDate
          : new Date(updateTrainingBlockDto.raceDate);
    }

    if (updateTrainingBlockDto.startDate) {
      data.startDate =
        updateTrainingBlockDto.startDate instanceof Date
          ? updateTrainingBlockDto.startDate
          : new Date(updateTrainingBlockDto.startDate);
    }

    const block = await this.prisma.trainingBlock.findUnique({ where: { id } });
    if (block && (data.raceDate !== undefined || data.startDate !== undefined)) {
      const raceDate = (data.raceDate as Date) ?? block.raceDate;
      const startDate = (data.startDate as Date) ?? block.startDate;
      data.durationWeeks = Math.ceil(
        (raceDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
    }

    return this.prisma.trainingBlock.update({
      where: { id },
      data: data as Parameters<PrismaService['trainingBlock']['update']>[0]['data'],
    });
  }

  async remove(id: string) {
    return this.prisma.trainingBlock.delete({
      where: { id },
    });
  }
}
