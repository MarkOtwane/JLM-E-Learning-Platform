import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send a message from one user to another
   */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    // Validate receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Prevent sending message to self
    if (senderId === dto.receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        subject: dto.subject,
        body: dto.body,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Get all messages received by a user
   */
  async getReceivedMessages(
    userId: string,
    skip: number = 0,
    take: number = 50,
  ) {
    const messages = await this.prisma.message.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await this.prisma.message.count({
      where: { receiverId: userId },
    });

    return { messages, total };
  }

  /**
   * Get all messages sent by a user
   */
  async getSentMessages(userId: string, skip: number = 0, take: number = 50) {
    const messages = await this.prisma.message.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await this.prisma.message.count({
      where: { senderId: userId },
    });

    return { messages, total };
  }

  /**
   * Get a single message by ID
   */
  async getMessageById(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user has access to this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only receiver can mark as read
    if (message.receiverId !== userId) {
      throw new BadRequestException('Only receiver can mark message as read');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Delete a message (soft delete - set as deleted)
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender or receiver can delete
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new BadRequestException(
        'You do not have permission to delete this message',
      );
    }

    return this.prisma.message.delete({
      where: { id: messageId },
    });
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    userId: string,
    otherUserId: string,
    skip: number = 0,
    take: number = 50,
  ) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });

    const total = await this.prisma.message.count({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      },
    });

    return { messages, total };
  }

  /**
   * Get contacts for a student (instructors from enrolled courses + fellow students)
   */
  async getStudentContacts(userId: string) {
    // Get the user's role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let instructors: any[] = [];
    let fellowStudents: any[] = [];

    if (user.role === 'STUDENT') {
      // Get instructors from enrolled courses
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicture: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Extract unique instructors
      const instructorMap = new Map();
      for (const enrollment of enrollments) {
        const instructor = enrollment.course.instructor;
        if (instructor && !instructorMap.has(instructor.id)) {
          instructorMap.set(instructor.id, {
            ...instructor,
            type: 'instructor',
            courseTitle: enrollment.course.title,
          });
        }
      }
      instructors = Array.from(instructorMap.values());

      // Get fellow students from same courses
      const courseIds = enrollments.map((e) => e.courseId);
      if (courseIds.length > 0) {
        const fellowEnrollments = await this.prisma.enrollment.findMany({
          where: {
            courseId: { in: courseIds },
            userId: { not: userId },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                role: true,
              },
            },
          },
        });

        // Extract unique fellow students
        const studentMap = new Map();
        for (const enrollment of fellowEnrollments) {
          const student = enrollment.user;
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              ...student,
              type: 'student',
            });
          }
        }
        fellowStudents = Array.from(studentMap.values());
      }
    } else if (user.role === 'INSTRUCTOR') {
      // For instructors, get students enrolled in their courses
      const courses = await this.prisma.course.findMany({
        where: { instructorId: userId },
        include: {
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicture: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      const studentMap = new Map();
      for (const course of courses) {
        for (const enrollment of course.enrollments) {
          const student = enrollment.user;
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              ...student,
              type: 'student',
              courseTitle: course.title,
            });
          }
        }
      }
      fellowStudents = Array.from(studentMap.values());

      // Also get all admins for instructor to contact
      const admins = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          role: true,
        },
      });

      instructors = admins.map((admin) => ({
        ...admin,
        type: 'admin',
      }));
    } else if (user.role === 'ADMIN') {
      // For admins, get all instructors
      const allInstructors = await this.prisma.user.findMany({
        where: {
          role: 'INSTRUCTOR',
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          role: true,
        },
      });

      instructors = allInstructors.map((instructor) => ({
        ...instructor,
        type: 'instructor',
      }));
    }

    // Get recent conversations (users the current user has exchanged messages with)
    const recentMessages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Extract unique conversation partners
    const conversationPartners = new Map();
    for (const msg of recentMessages) {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationPartners.has(partner.id)) {
        conversationPartners.set(partner.id, {
          ...partner,
          type: partner.role.toLowerCase(),
          lastMessage: msg.body,
          lastMessageTime: msg.createdAt,
        });
      }
    }

    return {
      instructors,
      fellowStudents,
      recentConversations: Array.from(conversationPartners.values()),
    };
  }

  /**
   * Get all conversations summary for a user
   */
  async getConversationsSummary(userId: string) {
    // Get all messages where user is sender or receiver
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversations = new Map();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partner: {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            profilePicture: partner.profilePicture,
            role: partner.role,
          },
          lastMessage: msg.body,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          lastMessageSenderId: msg.senderId,
        });
      }

      // Count unread messages
      const conv = conversations.get(partnerId);
      if (msg.receiverId === userId && !msg.isRead) {
        conv.unreadCount++;
      }
    }

    return Array.from(conversations.values()).sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime(),
    );
  }
}
