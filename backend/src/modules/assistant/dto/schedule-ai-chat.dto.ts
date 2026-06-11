import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleAiHistoryItem {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content: string;
}

export class ScheduleAiChatDto {
  @IsString()
  @MaxLength(2000)
  message: string;

  /** Doctor's display name (passed from the frontend — used in the AI system prompt). */
  @IsString()
  @MaxLength(200)
  doctorName: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleAiHistoryItem)
  history?: ScheduleAiHistoryItem[];
}

export class ScheduleAiAnalyzeDto {
  /** Doctor's display name — used in the AI prompt. */
  @IsString()
  @MaxLength(200)
  doctorName: string;
}

export type ScheduleAiAnalysisResult = {
  insights: string[];
  risks: string[];
  recommendations: string[];
};
