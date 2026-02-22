import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Course Version Service - Audit trail and version history management
 * Tracks all changes made to courses with user attribution and timestamps
 */
@Injectable()
export class CourseVersionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get complete version history for a course with pagination
   */
  async getCourseVersionHistory(
    courseId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const [versions, total] = await Promise.all([
      this.prisma.courseVersion.findMany({
        where: { courseId },
        include: {
          changedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.courseVersion.count({ where: { courseId } }),
    ]);

    return {
      course: {
        id: course.id,
        title: course.title,
      },
      versions: versions.map((v) => this.formatVersion(v)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get specific version details
   */
  async getVersionDetails(courseId: string, versionNumber: number) {
    const version = await this.prisma.courseVersion.findFirst({
      where: {
        courseId,
        versionNumber,
      },
      include: {
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for this course`,
      );
    }

    return this.formatVersion(version);
  }

  /**
   * Get diff between two versions
   */
  async getVersionDiff(
    courseId: string,
    fromVersion: number,
    toVersion: number,
  ) {
    const [from, to] = await Promise.all([
      this.prisma.courseVersion.findFirst({
        where: { courseId, versionNumber: fromVersion },
      }),
      this.prisma.courseVersion.findFirst({
        where: { courseId, versionNumber: toVersion },
      }),
    ]);

    if (!from || !to) {
      throw new NotFoundException('One or both versions not found');
    }

    const fromChanges = JSON.parse(from.changes);
    const toChanges = JSON.parse(to.changes);

    return {
      from: {
        versionNumber: from.versionNumber,
        timestamp: from.createdAt,
        changeType: from.changeType,
      },
      to: {
        versionNumber: to.versionNumber,
        timestamp: to.createdAt,
        changeType: to.changeType,
      },
      diff: this.calculateDiff(fromChanges, toChanges),
    };
  }

  /**
   * Get version timeline showing all changes chronologically
   */
  async getVersionTimeline(courseId: string) {
    const versions = await this.prisma.courseVersion.findMany({
      where: { courseId },
      include: {
        changedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (versions.length === 0) {
      throw new NotFoundException('No version history found for this course');
    }

    return {
      courseId,
      totalVersions: versions.length,
      timeline: versions.map((v) => ({
        versionNumber: v.versionNumber,
        timestamp: v.createdAt,
        changeType: v.changeType,
        changedBy: v.changedBy,
        summary: this.generateChangeSummary(v.changeType, v.changes),
      })),
    };
  }

  /**
   * Get activity report for a course
   */
  async getActivityReport(courseId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const versions = await this.prisma.courseVersion.findMany({
      where: {
        courseId,
        createdAt: { gte: startDate },
      },
      include: {
        changedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by user and change type
    const groupedByUser = this.groupVersionsByUser(versions);
    const groupedByChangeType = this.groupVersionsByChangeType(versions);

    return {
      courseId,
      period: `Last ${days} days`,
      startDate,
      endDate: new Date(),
      totalChanges: versions.length,
      groupedByUser,
      groupedByChangeType,
      recentActivity: versions.slice(0, 10).map((v) => ({
        versionNumber: v.versionNumber,
        timestamp: v.createdAt,
        changeType: v.changeType,
        changedBy: v.changedBy.name,
      })),
    };
  }

  /**
   * Bulk archive old versions (keep only last N versions)
   */
  async cleanupOldVersions(courseId: string, keepVersions: number = 50) {
    const versions = await this.prisma.courseVersion.findMany({
      where: { courseId },
      select: { id: true, versionNumber: true },
      orderBy: { versionNumber: 'desc' },
      skip: keepVersions,
    });

    if (versions.length === 0) {
      return {
        success: true,
        message: 'No old versions to clean up',
        deletedCount: 0,
      };
    }

    const idsToDelete = versions.map((v) => v.id);

    await this.prisma.courseVersion.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    return {
      success: true,
      message: `Deleted ${versions.length} old versions`,
      deletedCount: versions.length,
    };
  }

  /**
   * Helper: Format version for API response
   */
  private formatVersion(version: any) {
    return {
      versionNumber: version.versionNumber,
      changeType: version.changeType,
      timestamp: version.createdAt,
      changedBy: {
        id: version.changedBy.id,
        name: version.changedBy.name,
        email: version.changedBy.email,
      },
      changes: JSON.parse(version.changes),
      changeSummary: this.generateChangeSummary(
        version.changeType,
        version.changes,
      ),
    };
  }

  /**
   * Helper: Generate human-readable change summary
   */
  private generateChangeSummary(
    changeType: string,
    changesJson: string,
  ): string {
    const changes = JSON.parse(changesJson);

    switch (changeType) {
      case 'created':
        return 'Course created';
      case 'published':
        return 'Course published';
      case 'archived':
        return 'Course archived';
      case 'updated': {
        const changedFields = Object.keys(changes).length;
        const fields = Object.keys(changes).slice(0, 3).join(', ');
        return `Updated ${changedFields} field(s): ${fields}${
          changedFields > 3 ? '...' : ''
        }`;
      }
      default:
        return `${changeType}`;
    }
  }

  /**
   * Helper: Calculate diff between two change objects
   */
  private calculateDiff(from: any, to: any): any {
    const diff: any = {};

    // Find all keys from both objects
    const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

    for (const key of allKeys) {
      if (JSON.stringify(from[key]) !== JSON.stringify(to[key])) {
        diff[key] = {
          from: from[key],
          to: to[key],
        };
      }
    }

    return diff;
  }

  /**
   * Helper: Group versions by user
   */
  private groupVersionsByUser(versions: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const version of versions) {
      const userName = version.changedBy.name;
      grouped[userName] = (grouped[userName] || 0) + 1;
    }

    return grouped;
  }

  /**
   * Helper: Group versions by change type
   */
  private groupVersionsByChangeType(versions: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const version of versions) {
      const changeType = version.changeType;
      grouped[changeType] = (grouped[changeType] || 0) + 1;
    }

    return grouped;
  }
}
