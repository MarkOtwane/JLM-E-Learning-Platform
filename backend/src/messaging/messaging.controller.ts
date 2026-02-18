import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagingService } from './messaging.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Send a message to another user
   * POST /messages/send
   */
  @Post('send')
  async sendMessage(@User('id') userId: string, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(userId, dto);
  }

  /**
   * Get all received messages
   * GET /messages/received?skip=0&take=50
   */
  @Get('received')
  async getReceivedMessages(
    @User('id') userId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '50',
  ) {
    return this.messagingService.getReceivedMessages(
      userId,
      parseInt(skip),
      parseInt(take),
    );
  }

  /**
   * Get all sent messages
   * GET /messages/sent?skip=0&take=50
   */
  @Get('sent')
  async getSentMessages(
    @User('id') userId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '50',
  ) {
    return this.messagingService.getSentMessages(
      userId,
      parseInt(skip),
      parseInt(take),
    );
  }

  /**
   * Get unread message count
   * GET /messages/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@User('id') userId: string) {
    return this.messagingService.getUnreadCount(userId);
  }

  /**
   * Get conversation with another user
   * GET /messages/conversation/:otherUserId?skip=0&take=50
   */
  @Get('conversation/:otherUserId')
  async getConversation(
    @User('id') userId: string,
    @Param('otherUserId') otherUserId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '50',
  ) {
    return this.messagingService.getConversation(
      userId,
      otherUserId,
      parseInt(skip),
      parseInt(take),
    );
  }

  /**
   * Get a single message by ID
   * GET /messages/:id
   */
  @Get(':id')
  async getMessageById(
    @User('id') userId: string,
    @Param('id') messageId: string,
  ) {
    return this.messagingService.getMessageById(messageId, userId);
  }

  /**
   * Mark a message as read
   * PATCH /messages/:id/read
   */
  @Patch(':id/read')
  async markAsRead(@User('id') userId: string, @Param('id') messageId: string) {
    return this.messagingService.markAsRead(messageId, userId);
  }

  /**
   * Delete a message
   * DELETE /messages/:id
   */
  @Delete(':id')
  async deleteMessage(
    @User('id') userId: string,
    @Param('id') messageId: string,
  ) {
    return this.messagingService.deleteMessage(messageId, userId);
  }
}
