import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { conversation } from './conversation.schema';
import { user } from './users.schema';

export const senderTypeEnum = pgEnum('sender_type_enum', ['doctor', 'patient']);

export const message = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => conversation.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: integer('sender_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  senderType: senderTypeEnum('sender_type').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
});

export type MessageRow = typeof message.$inferSelect;
export type NewMessageRow = typeof message.$inferInsert;
