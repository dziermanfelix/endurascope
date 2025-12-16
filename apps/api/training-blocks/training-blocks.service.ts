import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingBlockDto, UpdateTrainingBlockDto } from './dto/training-block.dto';

@Injectable()
export class TrainingBlocksService {
  constructor(private prisma: PrismaService) {}

  async create(createTrainingBlockDto: CreateTrainingBlockDto) {
    // Convert date strings to Date objects if needed
    const data = {
      ...createTrainingBlockDto,
      raceDate:
        createTrainingBlockDto.raceDate instanceof Date
          ? createTrainingBlockDto.raceDate
          : new Date(createTrainingBlockDto.raceDate),
      startDate:
        createTrainingBlockDto.startDate instanceof Date
          ? createTrainingBlockDto.startDate
          : new Date(createTrainingBlockDto.startDate),
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
    // Convert date strings to Date objects if needed
    const data: any = { ...updateTrainingBlockDto };

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

    return this.prisma.trainingBlock.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.trainingBlock.delete({
      where: { id },
    });
  }
}
