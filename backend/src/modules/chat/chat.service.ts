import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, ne as neq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import {
  conversation,
  doctor,
  message,
  patient,
  user,
} from '../../database/schema';
import type { TokenPayload } from '../auth/jwt';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendMessageDto } from './dto/send-message.dto';

type ChatActor = {
  userId: number;
  role: 'doctor' | 'patient';
  profileId: string;
};

@Injectable()
export class ChatService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listConversations(currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);
    const rows = actor.role === 'doctor'
      ? await this.db
          .select({
            conversationId: conversation.id,
            createdAt: conversation.createdAt,
            participantName: user.name,
            participantRole: user.role,
            participantUserId: user.id,
          })
          .from(conversation)
          .innerJoin(patient, eq(conversation.patientId, patient.id))
          .innerJoin(user, eq(patient.userId, user.id))
          .where(eq(conversation.doctorId, actor.profileId))
          .orderBy(desc(conversation.createdAt))
      : await this.db
          .select({
            conversationId: conversation.id,
            createdAt: conversation.createdAt,
            participantName: user.name,
            participantRole: user.role,
            participantUserId: user.id,
          })
          .from(conversation)
          .innerJoin(doctor, eq(conversation.doctorId, doctor.id))
          .innerJoin(user, eq(doctor.userId, user.id))
          .where(eq(conversation.patientId, actor.profileId))
          .orderBy(desc(conversation.createdAt));

    if (!rows.length) return [];

    const conversationIds = rows.map((r) => r.conversationId);
    const messageRows = await this.db
      .select({
        conversationId: message.conversationId,
        text: message.message,
        senderType: message.senderType,
        sentAt: message.sentAt,
        isRead: message.isRead,
      })
      .from(message)
      .where(inArray(message.conversationId, conversationIds))
      .orderBy(desc(message.sentAt));

    const latestByConversation = new Map<number, (typeof messageRows)[number]>();
    const unreadCountByConversation = new Map<number, number>();
    for (const msg of messageRows) {
      if (!latestByConversation.has(msg.conversationId)) {
        latestByConversation.set(msg.conversationId, msg);
      }
      if (msg.senderType !== actor.role && !msg.isRead) {
        unreadCountByConversation.set(
          msg.conversationId,
          (unreadCountByConversation.get(msg.conversationId) ?? 0) + 1,
        );
      }
    }

    return rows.map((row) => {
      const latest = latestByConversation.get(row.conversationId);
      return {
        id: row.conversationId,
        participant: {
          userId: row.participantUserId,
          name: row.participantName,
          role: row.participantRole,
        },
        unreadCount: unreadCountByConversation.get(row.conversationId) ?? 0,
        lastMessage: latest
          ? {
              text: latest.text,
              senderType: latest.senderType,
              sentAt: latest.sentAt.toISOString(),
              isRead: latest.isRead,
            }
          : null,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  /**
   * Returns all users the current actor can start a conversation with.
   * - Doctor  → all patients in the system
   * - Patient → all doctors in the system
   */
  async listDirectory(currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);

    if (actor.role === 'doctor') {
      const rows = await this.db
        .select({
          id: patient.id,
          userId: user.id,
          name: user.name,
          role: user.role,
        })
        .from(patient)
        .innerJoin(user, eq(patient.userId, user.id))
        .orderBy(asc(user.name));
      return rows.map((r) => ({ profileId: r.id, name: r.name, role: r.role }));
    }

    // patient → list all doctors
    const rows = await this.db
      .select({
        id: doctor.id,
        userId: user.id,
        name: user.name,
        role: user.role,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .orderBy(asc(user.name));
    return rows.map((r) => ({ profileId: r.id, name: r.name, role: r.role }));
  }

  async createConversation(currentUser: TokenPayload, dto: CreateConversationDto) {
    const actor = await this.resolveActor(currentUser);

    const pair =
      actor.role === 'doctor'
        ? {
            doctorId: actor.profileId,
            patientId: dto.patientId,
          }
        : {
            doctorId: dto.doctorId,
            patientId: actor.profileId,
          };

    if (!pair.doctorId || !pair.patientId) {
      throw new BadRequestException('doctorId and patientId are required');
    }

    const doctorExists = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, pair.doctorId),
    });
    if (!doctorExists) {
      throw new NotFoundException('Doctor profile not found');
    }

    const patientExists = await this.db.query.patient.findFirst({
      where: eq(patient.id, pair.patientId),
    });
    if (!patientExists) {
      throw new NotFoundException('Patient profile not found');
    }

    const existing = await this.db.query.conversation.findFirst({
      where: and(
        eq(conversation.doctorId, pair.doctorId),
        eq(conversation.patientId, pair.patientId),
      ),
    });

    if (existing) {
      return existing;
    }

    const [created] = await this.db
      .insert(conversation)
      .values({
        doctorId: pair.doctorId,
        patientId: pair.patientId,
      })
      .returning();

    return created;
  }

  async listMessages(conversationId: number, currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);
    await this.assertConversationAccess(conversationId, actor);

    const rows = await this.db
      .select({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderType: message.senderType,
        message: message.message,
        isRead: message.isRead,
        sentAt: message.sentAt,
      })
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(asc(message.sentAt));

    await this.db
      .update(message)
      .set({ isRead: true })
      .where(
        and(
          eq(message.conversationId, conversationId),
          ne(message.senderType, actor.role),
          eq(message.isRead, false),
        ),
      );

    return rows.map((row) => ({
      ...row,
      sentAt: row.sentAt.toISOString(),
    }));
  }

  async sendMessage(
    conversationId: number,
    currentUser: TokenPayload,
    dto: SendMessageDto,
  ) {
    const actor = await this.resolveActor(currentUser);
    await this.assertConversationAccess(conversationId, actor);
    const text = dto.message.trim();
    if (!text) {
      throw new BadRequestException('Message cannot be empty');
    }

    const [created] = await this.db
      .insert(message)
      .values({
        conversationId,
        senderId: actor.userId,
        senderType: actor.role,
        message: text,
      })
      .returning();

    const recipients = await this.getConversationParticipantUserIds(conversationId);

    return {
      ...created,
      sentAt: created.sentAt.toISOString(),
      recipientUserIds: recipients,
    };
  }

  async ensureConversationAccess(conversationId: number, currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);
    await this.assertConversationAccess(conversationId, actor);
    return { ok: true };
  }

  private async resolveActor(currentUser: TokenPayload): Promise<ChatActor> {
    if (currentUser.role === 'doctor') {
      const profile = await this.db.query.doctor.findFirst({
        where: eq(doctor.userId, currentUser.sub),
      });
      if (!profile) throw new NotFoundException('Doctor profile not found');
      return { userId: currentUser.sub, role: 'doctor', profileId: profile.id };
    }

    if (currentUser.role === 'patient') {
      const profile = await this.db.query.patient.findFirst({
        where: eq(patient.userId, currentUser.sub),
      });
      if (!profile) throw new NotFoundException('Patient profile not found');
      return { userId: currentUser.sub, role: 'patient', profileId: profile.id };
    }

    throw new ForbiddenException('Only doctor and patient can use chat');
  }

  private async assertConversationAccess(conversationId: number, actor: ChatActor) {
    const row = await this.db.query.conversation.findFirst({
      where: eq(conversation.id, conversationId),
    });
    if (!row) {
      throw new NotFoundException('Conversation not found');
    }

    const isOwner =
      (actor.role === 'doctor' && row.doctorId === actor.profileId) ||
      (actor.role === 'patient' && row.patientId === actor.profileId);

    if (!isOwner) {
      throw new ForbiddenException('No access to this conversation');
    }

    return row;
  }

  private async getConversationParticipantUserIds(conversationId: number) {
    const rows = await this.db
      .select({
        doctorUserId: doctor.userId,
        patientUserId: patient.userId,
      })
      .from(conversation)
      .innerJoin(doctor, eq(conversation.doctorId, doctor.id))
      .innerJoin(patient, eq(conversation.patientId, patient.id))
      .where(eq(conversation.id, conversationId));

    const pair = rows[0];
    if (!pair) return [];
    return [pair.doctorUserId, pair.patientUserId];
  }
}
