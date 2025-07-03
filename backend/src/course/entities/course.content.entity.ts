/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseModule } from './course.module.entity';

export enum ContentType {
  VIDEO = 'video',
  PDF = 'pdf',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  LINK = 'link',
}

@Entity('course_contents')
export class CourseContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ContentType })
  contentType: ContentType;

  @Column({ type: 'text', nullable: true })
  contentUrl: string; // File path or external URL

  @Column({ type: 'text', nullable: true })
  textContent: string; // For text-based content

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({ type: 'int', default: 0 })
  duration: number; // in minutes

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFree: boolean; // For preview content

  @Column({ type: 'boolean', default: false })
  isDownloadable: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: any; // For storing additional content-specific data

  // Relationships
  @ManyToOne(() => CourseModule, (module) => module.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @Column({ name: 'module_id' })
  moduleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
