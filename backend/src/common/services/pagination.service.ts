import { Injectable } from '@nestjs/common';
import { PaginatedResponse, PaginationDto } from '../dto/pagination.dto';

@Injectable()
export class PaginationService {
  paginate<T>(
    data: T[],
    total: number,
    pagination: PaginationDto,
  ): PaginatedResponse<T> {
    return {
      data,
      pagination: {
        page: pagination.page!,
        limit: pagination.limit!,
        total,
        pages: Math.ceil(total / pagination.limit!),
      },
    };
  }
}
