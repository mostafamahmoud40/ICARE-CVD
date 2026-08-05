import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryItemDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;
}

export class PatientAiChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history!: ChatHistoryItemDto[];
}

export type PatientAiChatResponse = {
  reply: string;
  booking?: {
    confirmationCode: string;
    scheduledAt: string;
    doctorName: string;
    visitType: string;
  };
  /** True when cancel/reschedule/visit-type tools modified appointments. */
  appointmentsUpdated?: boolean;
};
