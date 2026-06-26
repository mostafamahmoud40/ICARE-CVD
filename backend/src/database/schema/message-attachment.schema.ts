import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { message } from './message.schema';

export const messageAttachmentTypeEnum = pgEnum(
  'message_attachment_type_enum',
  ['image', 'file'],
);

export const messageAttachment = pgTable('message_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: integer('message_id')
    .references(() => message.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 120 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  attachmentType: messageAttachmentTypeEnum('attachment_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type MessageAttachmentRow = typeof messageAttachment.$inferSelect;
export type NewMessageAttachmentRow = typeof messageAttachment.$inferInsert;
