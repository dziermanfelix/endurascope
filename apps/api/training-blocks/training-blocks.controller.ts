import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { TrainingBlocksService } from './training-blocks.service';
import { CreateTrainingBlockDto, UpdateTrainingBlockDto } from './dto/training-block.dto';

@Controller('api/training-blocks')
export class TrainingBlocksController {
  private readonly logger = new Logger(TrainingBlocksController.name);

  constructor(private readonly trainingBlocksService: TrainingBlocksService) {}

  @Post()
  async create(@Body() createTrainingBlockDto: CreateTrainingBlockDto) {
    try {
      // Validate required fields
      if (!createTrainingBlockDto.raceName || !createTrainingBlockDto.raceName.trim()) {
        throw new HttpException('Race name is required', HttpStatus.BAD_REQUEST);
      }
      if (!createTrainingBlockDto.identifier || !createTrainingBlockDto.identifier.trim()) {
        throw new HttpException('Identifier is required', HttpStatus.BAD_REQUEST);
      }
      if (!createTrainingBlockDto.raceDate) {
        throw new HttpException('Race date is required', HttpStatus.BAD_REQUEST);
      }
      if (!createTrainingBlockDto.startDate) {
        throw new HttpException('Start date is required', HttpStatus.BAD_REQUEST);
      }
      if (!createTrainingBlockDto.durationWeeks || createTrainingBlockDto.durationWeeks <= 0) {
        throw new HttpException('Duration weeks must be greater than 0', HttpStatus.BAD_REQUEST);
      }

      // Validate dates
      const raceDate = new Date(createTrainingBlockDto.raceDate);
      const startDate = new Date(createTrainingBlockDto.startDate);

      if (isNaN(raceDate.getTime())) {
        throw new HttpException('Invalid race date', HttpStatus.BAD_REQUEST);
      }
      if (isNaN(startDate.getTime())) {
        throw new HttpException('Invalid start date', HttpStatus.BAD_REQUEST);
      }

      // Validate that start date is before race date
      if (startDate >= raceDate) {
        throw new HttpException('Start date must be before race date', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Creating training block: ${createTrainingBlockDto.raceName}`);
      const trainingBlock = await this.trainingBlocksService.create(createTrainingBlockDto);
      return trainingBlock;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error creating training block: ${error.message}`, error.stack);
      throw new HttpException(`Failed to create training block: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.trainingBlocksService.findAll();
    } catch (error) {
      this.logger.error(`Error fetching training blocks: ${error.message}`, error.stack);
      throw new HttpException(`Failed to fetch training blocks: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const trainingBlock = await this.trainingBlocksService.findOne(id);
      if (!trainingBlock) {
        throw new HttpException('Training block not found', HttpStatus.NOT_FOUND);
      }
      return trainingBlock;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error fetching training block: ${error.message}`, error.stack);
      throw new HttpException(`Failed to fetch training block: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTrainingBlockDto: UpdateTrainingBlockDto) {
    try {
      // Validate dates if provided
      if (updateTrainingBlockDto.raceDate) {
        const raceDate = new Date(updateTrainingBlockDto.raceDate);
        if (isNaN(raceDate.getTime())) {
          throw new HttpException('Invalid race date', HttpStatus.BAD_REQUEST);
        }
      }
      if (updateTrainingBlockDto.startDate) {
        const startDate = new Date(updateTrainingBlockDto.startDate);
        if (isNaN(startDate.getTime())) {
          throw new HttpException('Invalid start date', HttpStatus.BAD_REQUEST);
        }
      }

      // If both dates are being updated, validate they're in the correct order
      if (updateTrainingBlockDto.startDate && updateTrainingBlockDto.raceDate) {
        const startDate = new Date(updateTrainingBlockDto.startDate);
        const raceDate = new Date(updateTrainingBlockDto.raceDate);
        if (startDate >= raceDate) {
          throw new HttpException('Start date must be before race date', HttpStatus.BAD_REQUEST);
        }
      }

      // If only one date is being updated, fetch the existing record to validate
      if (updateTrainingBlockDto.startDate || updateTrainingBlockDto.raceDate) {
        const existing = await this.trainingBlocksService.findOne(id);
        if (!existing) {
          throw new HttpException('Training block not found', HttpStatus.NOT_FOUND);
        }

        const startDate = updateTrainingBlockDto.startDate
          ? new Date(updateTrainingBlockDto.startDate)
          : new Date(existing.startDate);
        const raceDate = updateTrainingBlockDto.raceDate
          ? new Date(updateTrainingBlockDto.raceDate)
          : new Date(existing.raceDate);

        if (startDate >= raceDate) {
          throw new HttpException('Start date must be before race date', HttpStatus.BAD_REQUEST);
        }
      }

      this.logger.log(`Updating training block: ${id}`);
      const trainingBlock = await this.trainingBlocksService.update(id, updateTrainingBlockDto);
      return trainingBlock;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error updating training block: ${error.message}`, error.stack);
      throw new HttpException(`Failed to update training block: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const trainingBlock = await this.trainingBlocksService.findOne(id);
      if (!trainingBlock) {
        throw new HttpException('Training block not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Deleting training block: ${id}`);
      await this.trainingBlocksService.remove(id);
      return { success: true, message: 'Training block deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error deleting training block: ${error.message}`, error.stack);
      throw new HttpException(`Failed to delete training block: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
