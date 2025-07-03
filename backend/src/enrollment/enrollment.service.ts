import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../entities/enrollment.entity';
import { Progress, ProgressStatus } from '../entities/progress.entity';
import { Course } from '../../courses/entities/course.entity';
import { CourseContent } from '../../courses/entities/course-content.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { 
  EnrollDto, 
  UpdateEnrollmentDto, 
  UpdateProgressDto, 
  EnrollmentQueryDto,
  BulkEnrollDto 
} from '../dto/enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(CourseContent)
    private contentRepository: Repository<CourseContent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async enrollStudent(enrollDto: EnrollDto, studentId: string): Promise<Enrollment> {
    const { courseId, amountPaid = 0, paymentMethod, transactionId } = enrollDto;

    // Check if course exists and is published
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.contents'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== 'published') {
      throw new BadRequestException('Course is not available for enrollment');
    }

    // Check if student already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { studentId, courseId },
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Check if payment is required
    if (course.price > 0 && amountPaid < course.price) {
      throw new BadRequestException('Insufficient payment amount');
    }

    // Create enrollment
    const enrollment = this.enrollmentRepository.create({
      studentId,
      courseId,
      amountPaid,
      paymentMethod,
      transactionId,
      lastAccessedAt: new Date(),
    });

    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Create progress records for all course content
    await this.createProgressRecords(savedEnrollment.id, course);

    // Update course enrollment count
    await this.courseRepository.increment({ id: courseId }, 'enrollmentCount', 1);

    return savedEnrollment;
  }

  async bulkEnroll(bulkEnrollDto: BulkEnrollDto, _adminId: string): Promise<{ success: string[]; failed: string[] }> {
    const { studentIds, courseId, sendNotification = false } = bulkEnrollDto;
    
    const results = { success: [], failed: [] };

    for (const studentId of studentIds) {
      try {
        await this.enrollStudent({ courseId }, studentId);
        results.success.push(studentId);
      } catch (error) {
        results.failed.push(studentId);
      }
    }

    return results;
  }

  async unenrollStudent(enrollmentId: string, userId: string, userRole: UserRole): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['student', 'course'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only unenroll from your own courses');
    }

    // Update enrollment status instead of deleting
    enrollment.status = EnrollmentStatus.DROPPED;
    await this.enrollmentRepository.save(enrollment);

    // Update course enrollment count
    await this.courseRepository.decrement({ id: enrollment.courseId }, 'enrollmentCount', 1);
  }

  async updateProgress(enrollmentId: string, updateProgressDto: UpdateProgressDto, userId: string): Promise<Progress> {
    const { contentId, status, completionPercentage, timeSpent, metadata } = updateProgressDto;

    // Find enrollment and verify ownership
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only update progress for your own enrollments');
    }

    // Find or create progress record
    let progress = await this.progressRepository.findOne({
      where: { enrollmentId, contentId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        enrollmentId,
        contentId,
      });
    }

    // Update progress fields
    if (status !== undefined) {
      progress.status = status;
      
      if (status === ProgressStatus.COMPLETED && !progress.completedAt) {
        progress.completedAt = new Date();
      }
      
      if (status === ProgressStatus.IN_PROGRESS && !progress.startedAt) {
        progress.startedAt = new Date();
      }
    }

    if (completionPercentage !== undefined) {
      progress.completionPercentage = completionPercentage;
    }

    if (timeSpent !== undefined) {
      progress.timeSpent = timeSpent;
    }

    if (metadata !== undefined) {
      progress.metadata = metadata;
    }

    progress.lastAccessedAt = new Date();

    const savedProgress = await this.progressRepository.save(progress);

    // Update enrollment progress and last accessed time
    await this.updateEnrollmentProgress(enrollmentId);

    return savedProgress;
  }

  async getStudentEnrollments(studentId: string, query: EnrollmentQueryDto): Promise<{ enrollments: Enrollment[]; total: number }> {
    const qb = this.enrollmentRepository.createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('enrollment.progressRecords', 'progress')
      .where('enrollment.studentId = :studentId', { studentId });

    this.applyFilters(qb, query);
    this.applySorting(qb, query);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { enrollments, total };
  }

  async getCourseEnrollments(courseId: string, query: EnrollmentQueryDto): Promise<{ enrollments: Enrollment[]; total: number }> {
    const qb = this.enrollmentRepository.createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.progressRecords', 'progress')
      .where('enrollment.courseId = :courseId', { courseId });

    this.applyFilters(qb, query);
    this.applySorting(qb, query);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { enrollments, total };
  }

  async getEnrollmentById(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student', 'course', 'course.modules', 'course.modules.contents', 'progressRecords'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    async UpdateEnrollmentDto(
      enrollment: string,
      updateDto: UpdateEnrollmentDto,
      User: string,
      UserRole: UserRole,
    ): Promise<Enrollment> {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { id: enrollment },
        relations: ['student'],
      });
      if (_userRole !== UserRole.ADMIN && enrollment.studentId !== User) {
        throw new ForbiddenException('You can only update your own enrollments');
      }
  
      // Update fields if provided
      if (updateDto.status !== undefined) {
        enrollment.status = updateDto.status;
      }
  
      if (updateDto.progress !== undefined) {
        enrollment.progress = updateDto.progress;
      }
  
      if (updateDto.totalTimeSpent !== undefined) {
        enrollment.totalTimeSpent = updateDto.totalTimeSpent;
      }
  
      enrollment.updatedAt = new Date();
      return this.enrollmentRepository.save(enrollment);
    }
  
    private async createProgressRecords(enrollmentId: string, course: Course): Promise<void> {
      const progressRecords: Progress[] = [];
      
      // Flatten all content from all modules
      const allContents = course.modules.flatMap(module => module.contents);
  
      for (const content of allContents) {
        const progress = this.progressRepository.create({
          enrollmentId,
          contentId: content.id,
          status: ProgressStatus.NOT_STARTED,
          completionPercentage: 0,
        });
        progressRecords.push(progress);
      }
  
      await this.progressRepository.save(progressRecords);
    }
  
    private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
      // Calculate overall progress
      const progressStats = await this.progressRepository
        .createQueryBuilder('progress')
        .select('AVG(progress.completionPercentage)', 'avgCompletion')
        .addSelect('SUM(progress.timeSpent)', 'totalTimeSpent')
        .where('progress.enrollmentId = :enrollmentId', { enrollmentId })
        .getRawOne();
  
      const avgCompletion = parseFloat(progressStats.avgCompletion) || 0;
      const totalTimeSpent = parseFloat(progressStats.totalTimeSpent) || 0;
  
      // Update enrollment with new progress
      await this.enrollmentRepository.update(enrollmentId, {
        progress: avgCompletion,
        totalTimeSpent,
        lastAccessedAt: new Date(),
      });
    }
  
    private applyFilters(qb: SelectQueryBuilder<Enrollment>, query: EnrollmentQueryDto): void {
      if (query.status) {
        qb.andWhere('enrollment.status = :status', { status: query.status });
      }
  
      if (query.courseId) {
        qb.andWhere('enrollment.courseId = :courseId', { courseId: query.courseId });
      }
  
      if (query.studentId) {
        qb.andWhere('enrollment.studentId = :studentId', { studentId: query.studentId });
      }
  
      if (query.minProgress !== undefined) {
        qb.andWhere('enrollment.progress >= :minProgress', { minProgress: query.minProgress });
      }
  
      if (query.maxProgress !== undefined) {
        qb.andWhere('enrollment.progress <= :maxProgress', { maxProgress: query.maxProgress });
      }
    }
  
    private applySorting(qb: SelectQueryBuilder<Enrollment>, query: EnrollmentQueryDto): void {
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'DESC';
  
      switch (sortBy) {
        case 'createdAt':
          qb.orderBy('enrollment.createdAt', sortOrder);
          break;
        case 'progress':
          qb.orderBy('enrollment.progress', sortOrder);
          break;
        case 'lastAccessedAt':
          qb.orderBy('enrollment.lastAccessedAt', sortOrder);
          break;
        default:
          qb.orderBy('enrollment.createdAt', 'DESC');
      }
    }
  
    async getEnrollmentProgress(enrollmentId: string, userId: string): Promise<{ progress: Progress[]; total: number }> {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { id: enrollmentId },
      });
  
      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }
  
      // Only the student or admin can view progress
      if (enrollment.studentId !== userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('You can only view your own progress');
        }
      }
  
      const progress = await this.progressRepository.find({
        where: { enrollmentId },
        relations: ['content'],
        order: { content: { moduleId: 'ASC', order: 'ASC' } },
      });
  
      return { progress, total: progress.length };
    }
  
    async getEnrollmentWithContentProgress(enrollmentId: string, contentId: string, userId: string): Promise<Progress> {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { id: enrollmentId },
      });
  
      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }
  
      // Only the student or admin can view progress
      if (enrollment.studentId !== userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('You can only view your own progress');
        }
      }
  
      const progress = await this.progressRepository.findOne({
        where: { enrollmentId, contentId },
        relations: ['content'],
      });
  
      if (!progress) {
        throw new NotFoundException('Progress record not found');
      }
  
      return progress;
    }
}
