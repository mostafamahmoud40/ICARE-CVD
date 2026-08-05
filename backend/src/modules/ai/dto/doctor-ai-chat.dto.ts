import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DoctorChatHistoryItemDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;
}

export class DoctorAiChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DoctorChatHistoryItemDto)
  history!: DoctorChatHistoryItemDto[];

  /** Optional: focus the context on a specific patient (patientNumber or UUID). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  focusPatientId?: string;
}

export type DoctorAiChatResponse = {
  reply: string;
};
