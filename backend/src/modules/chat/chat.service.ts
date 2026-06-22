import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { Readable } from 'stream';
import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import {
  assistant,
  conversation,
  doctor,
  message,
  messageAttachment,
  patient,
  user,
} from '../../database/schema';
import type { TokenPayload } from '../auth/jwt';
import { ChatAttachmentService } from './chat-attachment.service';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { ChatUploadIntentDto, SendMessageDto } from './dto/send-message.dto';

type ChatActorRole = 'doctor' | 'patient' | 'assistant';

type ChatActor = {
  userId: number;
  role: ChatActorRole;
  profileId: string;
};

type ConversationListRow = {
  conversationId: number;
  createdAt: Date;
  participantName: string;
  participantRole: string;
  participantUserId: number;
  participantEmail: string | null;
  participantSpecialty: string | null;
  participantClinicLocation: string | null;
  participantAvatarUrl: string | null;
  participantUserAvatarUrl: string | null;
};

@Injectable()
export class ChatService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly chatAttachmentService: ChatAttachmentService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listConversations(currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);
    const rows = await this.fetchConversationListRows(actor);

    if (!rows.length) return [];

    const conversationIds = rows.map((r) => r.conversationId);
    const messageRows = await this.db
      .select({
        id: message.id,
        conversationId: message.conversationId,
        text: message.message,
        senderType: message.senderType,
        sentAt: message.sentAt,
        isRead: message.isRead,
      })
      .from(message)
      .where(inArray(message.conversationId, conversationIds))
      .orderBy(desc(message.sentAt));

    const latestByConversation = new Map<
      number,
      (typeof messageRows)[number]
    >();
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

    const latestMessageIds = Array.from(latestByConversation.values()).map(
      (row) => row.id,
    );
    const attachmentRows = latestMessageIds.length
      ? await this.db
          .select({
            messageId: messageAttachment.messageId,
            attachmentType: messageAttachment.attachmentType,
          })
          .from(messageAttachment)
          .where(inArray(messageAttachment.messageId, latestMessageIds))
      : [];

    const attachmentTypesByMessageId = new Map<number, string[]>();
    for (const attachment of attachmentRows) {
      const list = attachmentTypesByMessageId.get(attachment.messageId) ?? [];
      list.push(attachment.attachmentType);
      attachmentTypesByMessageId.set(attachment.messageId, list);
    }

    const result = await Promise.all(
      rows.map(async (row) => {
        const latest = latestByConversation.get(row.conversationId);
        const attachmentTypes = latest
          ? attachmentTypesByMessageId.get(latest.id)
          : undefined;
        return {
          id: row.conversationId,
          participant: {
            userId: row.participantUserId,
            name: row.participantName,
            role: row.participantRole,
            avatarUrl: await this.avatarUrlResolver.resolve(
              row.participantAvatarUrl ?? row.participantUserAvatarUrl,
            ),
            email: row.participantEmail ?? null,
            specialty: row.participantSpecialty ?? null,
            clinicLocation: row.participantClinicLocation ?? null,
          },
          unreadCount: unreadCountByConversation.get(row.conversationId) ?? 0,
          lastMessage: latest
            ? {
                text: this.previewLastMessage(latest.text, attachmentTypes),
                senderType: latest.senderType,
                sentAt: latest.sentAt.toISOString(),
                isRead: latest.isRead,
              }
            : null,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    );

    return result.sort((a, b) => {
      const aMs = new Date(a.lastMessage?.sentAt ?? a.createdAt).getTime();
      const bMs = new Date(b.lastMessage?.sentAt ?? b.createdAt).getTime();
      return bMs - aMs;
    });
  }

  async listDirectory(currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);

    if (actor.role === 'doctor') {
      const rows = await this.db
        .select({
          id: patient.id,
          userId: user.id,
          name: user.name,
          role: user.role,
          avatarUrl: patient.avatarUrl,
          userAvatarUrl: user.avatarUrl,
        })
        .from(patient)
        .innerJoin(user, eq(patient.userId, user.id))
        .orderBy(asc(user.name));
      return Promise.all(
        rows.map(async (r) => ({
          profileId: r.id,
          name: r.name,
          role: r.role,
          avatarUrl: await this.avatarUrlResolver.resolve(
            r.avatarUrl ?? r.userAvatarUrl,
          ),
          specialty: null,
        })),
      );
    }

    if (actor.role === 'patient') {
      const rows = await this.db
        .select({
          id: doctor.id,
          userId: user.id,
          name: user.name,
          role: user.role,
          specialty: doctor.specialty,
          avatarUrl: user.avatarUrl,
        })
        .from(doctor)
        .innerJoin(user, eq(doctor.userId, user.id))
        .orderBy(asc(user.name));
      return Promise.all(
        rows.map(async (r) => ({
          profileId: r.id,
          name: r.name,
          role: r.role,
          avatarUrl: await this.avatarUrlResolver.resolve(r.avatarUrl),
          specialty: r.specialty,
        })),
      );
    }

    const doctorRows = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        role: user.role,
        specialty: doctor.specialty,
        avatarUrl: user.avatarUrl,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .orderBy(asc(user.name));

    const patientRows = await this.db
      .select({
        id: patient.id,
        name: user.name,
        role: user.role,
        avatarUrl: patient.avatarUrl,
        userAvatarUrl: user.avatarUrl,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .orderBy(asc(user.name));

    const [resolvedDoctors, resolvedPatients] = await Promise.all([
      Promise.all(
        doctorRows.map(async (r) => ({
          profileId: r.id,
          name: r.name,
          role: r.role,
          avatarUrl: await this.avatarUrlResolver.resolve(r.avatarUrl),
          specialty: r.specialty,
        })),
      ),
      Promise.all(
        patientRows.map(async (r) => ({
          profileId: r.id,
          name: r.name,
          role: r.role,
          avatarUrl: await this.avatarUrlResolver.resolve(
            r.avatarUrl ?? r.userAvatarUrl,
          ),
          specialty: null,
        })),
      ),
    ]);

    return [...resolvedDoctors, ...resolvedPatients];
  }

  async createConversation(
    currentUser: TokenPayload,
    dto: CreateConversationDto,
  ) {
    const actor = await this.resolveActor(currentUser);

    if (actor.role === 'doctor') {
      if (!dto.patientId) {
        throw new BadRequestException('patientId is required');
      }
      return this.createDoctorPatientConversation(
        actor.profileId,
        dto.patientId,
      );
    }

    if (actor.role === 'patient') {
      if (!dto.doctorId) {
        throw new BadRequestException('doctorId is required');
      }
      return this.createDoctorPatientConversation(
        dto.doctorId,
        actor.profileId,
      );
    }

    if (dto.doctorId && dto.patientId) {
      throw new BadRequestException(
        'Provide either doctorId or patientId, not both',
      );
    }

    if (dto.doctorId) {
      return this.createAssistantDoctorConversation(
        actor.profileId,
        dto.doctorId,
      );
    }

    if (dto.patientId) {
      return this.createAssistantPatientConversation(
        actor.profileId,
        dto.patientId,
      );
    }

    throw new BadRequestException('doctorId or patientId is required');
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

    const messageIds = rows.map((row) => row.id);
    const attachmentRows = messageIds.length
      ? await this.db
          .select({
            id: messageAttachment.id,
            messageId: messageAttachment.messageId,
            fileName: messageAttachment.fileName,
            mimeType: messageAttachment.mimeType,
            sizeBytes: messageAttachment.sizeBytes,
            s3Key: messageAttachment.s3Key,
            attachmentType: messageAttachment.attachmentType,
          })
          .from(messageAttachment)
          .where(inArray(messageAttachment.messageId, messageIds))
      : [];

    const attachmentsByMessageId = new Map<
      number,
      (typeof attachmentRows)[number][]
    >();
    for (const attachment of attachmentRows) {
      const list = attachmentsByMessageId.get(attachment.messageId) ?? [];
      list.push(attachment);
      attachmentsByMessageId.set(attachment.messageId, list);
    }

    return rows.map((row) => {
      const attachments = attachmentsByMessageId.get(row.id) ?? [];
      return {
        ...row,
        sentAt: row.sentAt.toISOString(),
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          attachmentType: attachment.attachmentType,
          url: this.buildAttachmentFilePath(attachment.id),
        })),
      };
    });
  }

  async streamAttachmentFile(attachmentId: string, currentUser: TokenPayload) {
    const actor = await this.resolveActor(currentUser);
    const attachment = await this.db.query.messageAttachment.findFirst({
      where: eq(messageAttachment.id, attachmentId),
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const parentMessage = await this.db.query.message.findFirst({
      where: eq(message.id, attachment.messageId),
    });

    if (!parentMessage) {
      throw new NotFoundException('Attachment message not found');
    }

    await this.assertConversationAccess(parentMessage.conversationId, actor);

    const object = await this.chatAttachmentService.getObjectStream(attachment.s3Key);
    const body =
      object.body instanceof Readable
        ? object.body
        : Readable.from(object.body as AsyncIterable<Uint8Array>);

    return new StreamableFile(body, {
      type: attachment.mimeType || object.contentType,
      disposition: `inline; filename="${attachment.fileName.replace(/"/g, '')}"`,
      length: object.contentLength,
    });
  }

  async createAttachmentUploadIntent(
    conversationId: number,
    currentUser: TokenPayload,
    dto: ChatUploadIntentDto,
  ) {
    const actor = await this.resolveActor(currentUser);
    const row = await this.assertConversationAccess(conversationId, actor);
    const patientNumber = await this.resolveConversationPatientNumber(row);
    return this.chatAttachmentService.createUploadIntent(
      conversationId,
      dto,
      patientNumber,
    );
  }

  async sendMessage(
    conversationId: number,
    currentUser: TokenPayload,
    dto: SendMessageDto,
  ) {
    const actor = await this.resolveActor(currentUser);
    const row = await this.assertConversationAccess(conversationId, actor);
    const patientNumber = await this.resolveConversationPatientNumber(row);

    const text = dto.message?.trim() ?? '';
    const attachments = dto.attachments ?? [];

    if (!text && attachments.length === 0) {
      throw new BadRequestException('Message or attachment is required');
    }

    for (const attachment of attachments) {
      this.chatAttachmentService.validateUploadedAttachment(
        conversationId,
        attachment,
        patientNumber,
      );
    }

    const [created] = await this.db
      .insert(message)
      .values({
        conversationId,
        senderId: actor.userId,
        senderType: actor.role,
        message: text || this.buildAttachmentFallbackText(attachments),
      })
      .returning();

    let savedAttachments: Array<{
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      attachmentType: 'image' | 'file';
      url: string;
    }> = [];

    if (attachments.length) {
      const inserted = await this.db
        .insert(messageAttachment)
        .values(
          attachments.map((attachment) => ({
            messageId: created.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            s3Key: attachment.s3Key,
            attachmentType: attachment.attachmentType,
          })),
        )
        .returning();

      savedAttachments = inserted.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        attachmentType: attachment.attachmentType,
        url: this.buildAttachmentFilePath(attachment.id),
      }));
    }

    const recipients =
      await this.getConversationParticipantUserIds(conversationId);

    const senderName = await this.getUserDisplayName(actor.userId);
    const preview =
      text.length > 0
        ? text.slice(0, 120)
        : savedAttachments.length > 0
          ? `Sent ${savedAttachments.length} attachment(s)`
          : 'New message';

    const href =
      actor.role === 'doctor'
        ? '/doctor-inbox'
        : actor.role === 'assistant'
          ? '/assistant-inbox'
          : '/patient-inbox';

    void Promise.all(
      recipients
        .filter((userId) => userId !== actor.userId)
        .map((userId) =>
          this.notificationsService.dispatch({
            userId,
            kind: 'message',
            title: `Message from ${senderName}`,
            body: preview,
            href,
            metadata: { conversationId, messageId: created.id },
          }),
        ),
    ).catch(() => undefined);

    return {
      ...created,
      sentAt: created.sentAt.toISOString(),
      attachments: savedAttachments,
      recipientUserIds: recipients,
    };
  }

  async deleteMessage(
    conversationId: number,
    messageId: number,
    currentUser: TokenPayload,
  ) {
    const actor = await this.resolveActor(currentUser);
    await this.assertConversationAccess(conversationId, actor);

    const row = await this.db.query.message.findFirst({
      where: and(
        eq(message.id, messageId),
        eq(message.conversationId, conversationId),
      ),
    });

    if (!row) {
      throw new NotFoundException('Message not found');
    }

    if (row.senderId !== actor.userId) {
      throw new ForbiddenException('Only the sender can delete this message');
    }

    const attachments = await this.db
      .select({ s3Key: messageAttachment.s3Key })
      .from(messageAttachment)
      .where(eq(messageAttachment.messageId, messageId));

    for (const attachment of attachments) {
      try {
        await this.chatAttachmentService.deleteStoredFile(attachment.s3Key);
      } catch {
        // Message metadata should still be removed even if object storage cleanup fails.
      }
    }

    await this.db
      .delete(message)
      .where(
        and(eq(message.id, messageId), eq(message.conversationId, conversationId)),
      );

    const recipients =
      await this.getConversationParticipantUserIds(conversationId);

    return {
      conversationId,
      messageId,
      recipientUserIds: recipients,
    };
  }

  async ensureConversationAccess(
    conversationId: number,
    currentUser: TokenPayload,
  ) {
    const actor = await this.resolveActor(currentUser);
    await this.assertConversationAccess(conversationId, actor);
    return { ok: true };
  }

  async getOtherParticipantUserIds(conversationId: number, excludeUserId: number) {
    const ids = await this.getConversationParticipantUserIds(conversationId);
    return ids.filter((id) => id !== excludeUserId);
  }

  async getUserDisplayName(userId: number): Promise<string> {
    const row = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { name: true },
    });
    return row?.name ?? 'Someone';
  }

  private async fetchConversationListRows(
    actor: ChatActor,
  ): Promise<ConversationListRow[]> {
    if (actor.role === 'doctor') {
      const [patients, assistants] = await Promise.all([
        this.db
          .select({
            conversationId: conversation.id,
            createdAt: conversation.createdAt,
            participantName: user.name,
            participantRole: user.role,
            participantUserId: user.id,
            participantEmail: user.email,
            participantSpecialty: sql<string | null>`null`,
            participantClinicLocation: sql<string | null>`null`,
            participantAvatarUrl: patient.avatarUrl,
            participantUserAvatarUrl: user.avatarUrl,
          })
          .from(conversation)
          .innerJoin(patient, eq(conversation.patientId, patient.id))
          .innerJoin(user, eq(patient.userId, user.id))
          .where(
            and(
              eq(conversation.conversationType, 'doctor_patient'),
              eq(conversation.doctorId, actor.profileId),
            ),
          )
          .orderBy(desc(conversation.createdAt)),
        this.db
          .select({
            conversationId: conversation.id,
            createdAt: conversation.createdAt,
            participantName: user.name,
            participantRole: sql<string>`'assistant'`,
            participantUserId: user.id,
            participantEmail: user.email,
            participantSpecialty: sql<string | null>`null`,
            participantClinicLocation: sql<string | null>`null`,
            participantAvatarUrl: user.avatarUrl,
            participantUserAvatarUrl: user.avatarUrl,
          })
          .from(conversation)
          .innerJoin(assistant, eq(conversation.assistantId, assistant.id))
          .innerJoin(user, eq(assistant.userId, user.id))
          .where(
            and(
              eq(conversation.conversationType, 'assistant_doctor'),
              eq(conversation.doctorId, actor.profileId),
            ),
          )
          .orderBy(desc(conversation.createdAt)),
      ]);
      return [...patients, ...assistants];
    }

    if (actor.role === 'patient') {
      const [doctors, assistants] = await Promise.all([
        this.db
          .select({
            conversationId: conversation.id,
            createdAt: conversation.createdAt,
            participantName: user.name,
            participantRole: user.role,
            participantUserId: user.id,
            participantEmail: user.email,
            participantSpecialty: doctor.specialty,
            participantClinicLocation: doctor.clinicLocation,
            participantAvatarUrl: user.avatarUrl,
            participantUserAvatarUrl: user.avatarUrl,
          })
          .from(conversation)
          .innerJoin(doctor, eq(conversation.doctorId, doctor.id))
          .innerJoin(user, eq(doctor.userId, user.id))
          .where(
            and(
              eq(conversation.conversationType, 'doctor_patient'),
              eq(conversation.patientId, actor.profileId),
            ),
          )
          .orderBy(desc(conversation.createdAt)),
        this.db
          .select({
            conversationId: conversation.id,
            createdAt: conversation.createdAt,
            participantName: user.name,
            participantRole: sql<string>`'assistant'`,
            participantUserId: user.id,
            participantEmail: user.email,
            participantSpecialty: sql<string | null>`null`,
            participantClinicLocation: sql<string | null>`null`,
            participantAvatarUrl: user.avatarUrl,
            participantUserAvatarUrl: user.avatarUrl,
          })
          .from(conversation)
          .innerJoin(assistant, eq(conversation.assistantId, assistant.id))
          .innerJoin(user, eq(assistant.userId, user.id))
          .where(
            and(
              eq(conversation.conversationType, 'assistant_patient'),
              eq(conversation.patientId, actor.profileId),
            ),
          )
          .orderBy(desc(conversation.createdAt)),
      ]);
      return [...doctors, ...assistants];
    }

    const [doctors, patients] = await Promise.all([
      this.db
        .select({
          conversationId: conversation.id,
          createdAt: conversation.createdAt,
          participantName: user.name,
          participantRole: user.role,
          participantUserId: user.id,
          participantEmail: user.email,
          participantSpecialty: doctor.specialty,
          participantClinicLocation: doctor.clinicLocation,
          participantAvatarUrl: user.avatarUrl,
          participantUserAvatarUrl: user.avatarUrl,
        })
        .from(conversation)
        .innerJoin(doctor, eq(conversation.doctorId, doctor.id))
        .innerJoin(user, eq(doctor.userId, user.id))
        .where(
          and(
            eq(conversation.conversationType, 'assistant_doctor'),
            eq(conversation.assistantId, actor.profileId),
          ),
        )
        .orderBy(desc(conversation.createdAt)),
      this.db
        .select({
          conversationId: conversation.id,
          createdAt: conversation.createdAt,
          participantName: user.name,
          participantRole: user.role,
          participantUserId: user.id,
          participantEmail: user.email,
          participantSpecialty: sql<string | null>`null`,
          participantClinicLocation: sql<string | null>`null`,
          participantAvatarUrl: patient.avatarUrl,
          participantUserAvatarUrl: user.avatarUrl,
        })
        .from(conversation)
        .innerJoin(patient, eq(conversation.patientId, patient.id))
        .innerJoin(user, eq(patient.userId, user.id))
        .where(
          and(
            eq(conversation.conversationType, 'assistant_patient'),
            eq(conversation.assistantId, actor.profileId),
          ),
        )
        .orderBy(desc(conversation.createdAt)),
    ]);

    return [...doctors, ...patients];
  }

  private async createDoctorPatientConversation(
    doctorId: string,
    patientId: string,
  ) {
    const doctorExists = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, doctorId),
    });
    if (!doctorExists) {
      throw new NotFoundException('Doctor profile not found');
    }

    const patientExists = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientExists) {
      throw new NotFoundException('Patient profile not found');
    }

    const existing = await this.db.query.conversation.findFirst({
      where: and(
        eq(conversation.conversationType, 'doctor_patient'),
        eq(conversation.doctorId, doctorId),
        eq(conversation.patientId, patientId),
      ),
    });

    if (existing) return existing;

    const [created] = await this.db
      .insert(conversation)
      .values({
        conversationType: 'doctor_patient',
        doctorId,
        patientId,
      })
      .returning();

    return created;
  }

  private async createAssistantDoctorConversation(
    assistantId: string,
    doctorId: string,
  ) {
    const assistantExists = await this.db.query.assistant.findFirst({
      where: eq(assistant.id, assistantId),
    });
    if (!assistantExists) {
      throw new NotFoundException('Assistant profile not found');
    }

    const doctorExists = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, doctorId),
    });
    if (!doctorExists) {
      throw new NotFoundException('Doctor profile not found');
    }

    const existing = await this.db.query.conversation.findFirst({
      where: and(
        eq(conversation.conversationType, 'assistant_doctor'),
        eq(conversation.assistantId, assistantId),
        eq(conversation.doctorId, doctorId),
      ),
    });

    if (existing) return existing;

    const [created] = await this.db
      .insert(conversation)
      .values({
        conversationType: 'assistant_doctor',
        assistantId,
        doctorId,
      })
      .returning();

    return created;
  }

  private async createAssistantPatientConversation(
    assistantId: string,
    patientId: string,
  ) {
    const assistantExists = await this.db.query.assistant.findFirst({
      where: eq(assistant.id, assistantId),
    });
    if (!assistantExists) {
      throw new NotFoundException('Assistant profile not found');
    }

    const patientExists = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientExists) {
      throw new NotFoundException('Patient profile not found');
    }

    const existing = await this.db.query.conversation.findFirst({
      where: and(
        eq(conversation.conversationType, 'assistant_patient'),
        eq(conversation.assistantId, assistantId),
        eq(conversation.patientId, patientId),
      ),
    });

    if (existing) return existing;

    const [created] = await this.db
      .insert(conversation)
      .values({
        conversationType: 'assistant_patient',
        assistantId,
        patientId,
      })
      .returning();

    return created;
  }

  private buildAttachmentFilePath(attachmentId: string) {
    return `/chat/attachments/${attachmentId}/file`;
  }

  private buildAttachmentFallbackText(
    attachments: NonNullable<SendMessageDto['attachments']>,
  ) {
    if (attachments.every((item) => item.attachmentType === 'image')) {
      return attachments.length === 1 ? '📷 Photo' : `📷 ${attachments.length} photos`;
    }
    if (attachments.length === 1) {
      return `📎 ${attachments[0].fileName}`;
    }
    return `📎 ${attachments.length} files`;
  }

  private previewLastMessage(text: string, attachmentTypes?: string[]) {
    const trimmed = text.trim();
    const isAttachmentFallback =
      trimmed.startsWith('📷') || trimmed.startsWith('📎');
    const hasUserCaption = trimmed.length > 0 && !isAttachmentFallback;

    if (hasUserCaption) return trimmed;

    if (attachmentTypes?.length) {
      if (attachmentTypes.every((type) => type === 'image')) return 'Photo';
      return 'Document';
    }

    return this.previewMessageText(text);
  }

  private previewMessageText(text: string) {
    const trimmed = text.trim();
    if (trimmed.startsWith('📷')) return 'Photo';
    if (trimmed.startsWith('📎')) return 'Document';
    return text;
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
      return {
        userId: currentUser.sub,
        role: 'patient',
        profileId: profile.id,
      };
    }

    if (currentUser.role === 'assistant') {
      const profile = await this.db.query.assistant.findFirst({
        where: eq(assistant.userId, currentUser.sub),
      });
      if (!profile) throw new NotFoundException('Assistant profile not found');
      return {
        userId: currentUser.sub,
        role: 'assistant',
        profileId: profile.id,
      };
    }

    throw new ForbiddenException('Chat is not available for this role');
  }

  private async assertConversationAccess(
    conversationId: number,
    actor: ChatActor,
  ) {
    const row = await this.db.query.conversation.findFirst({
      where: eq(conversation.id, conversationId),
    });
    if (!row) {
      throw new NotFoundException('Conversation not found');
    }

    const type = row.conversationType ?? 'doctor_patient';

    if (type === 'doctor_patient') {
      const isOwner =
        (actor.role === 'doctor' && row.doctorId === actor.profileId) ||
        (actor.role === 'patient' && row.patientId === actor.profileId);
      if (!isOwner) {
        throw new ForbiddenException('No access to this conversation');
      }
      return row;
    }

    if (type === 'assistant_doctor') {
      const isOwner =
        (actor.role === 'assistant' && row.assistantId === actor.profileId) ||
        (actor.role === 'doctor' && row.doctorId === actor.profileId);
      if (!isOwner) {
        throw new ForbiddenException('No access to this conversation');
      }
      return row;
    }

    if (type === 'assistant_patient') {
      const isOwner =
        (actor.role === 'assistant' && row.assistantId === actor.profileId) ||
        (actor.role === 'patient' && row.patientId === actor.profileId);
      if (!isOwner) {
        throw new ForbiddenException('No access to this conversation');
      }
      return row;
    }

    throw new ForbiddenException('No access to this conversation');
  }

  private async resolveConversationPatientNumber(row: {
    patientId: string | null;
  }): Promise<string | undefined> {
    if (!row.patientId) return undefined;

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, row.patientId),
      columns: { patientNumber: true },
    });
    return patientRow?.patientNumber;
  }

  private async getConversationParticipantUserIds(conversationId: number) {
    const row = await this.db.query.conversation.findFirst({
      where: eq(conversation.id, conversationId),
    });
    if (!row) return [];

    const type = row.conversationType ?? 'doctor_patient';

    if (type === 'doctor_patient' && row.doctorId && row.patientId) {
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

    if (type === 'assistant_doctor' && row.assistantId && row.doctorId) {
      const rows = await this.db
        .select({
          assistantUserId: assistant.userId,
          doctorUserId: doctor.userId,
        })
        .from(conversation)
        .innerJoin(assistant, eq(conversation.assistantId, assistant.id))
        .innerJoin(doctor, eq(conversation.doctorId, doctor.id))
        .where(eq(conversation.id, conversationId));

      const pair = rows[0];
      if (!pair) return [];
      return [pair.assistantUserId, pair.doctorUserId];
    }

    if (type === 'assistant_patient' && row.assistantId && row.patientId) {
      const rows = await this.db
        .select({
          assistantUserId: assistant.userId,
          patientUserId: patient.userId,
        })
        .from(conversation)
        .innerJoin(assistant, eq(conversation.assistantId, assistant.id))
        .innerJoin(patient, eq(conversation.patientId, patient.id))
        .where(eq(conversation.id, conversationId));

      const pair = rows[0];
      if (!pair) return [];
      return [pair.assistantUserId, pair.patientUserId];
    }

    return [];
  }
}
