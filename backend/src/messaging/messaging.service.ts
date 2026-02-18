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
}
