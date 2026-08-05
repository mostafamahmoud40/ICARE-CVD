import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BlockedDateDto {
  @IsUUID()
  id!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString({ each: true })
  @Length(0, 100, { each: true })
  reason?: string | null;
}

export class CreateBlockedDateDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  reason?: string;
}

export class CreateBlockedDatesBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlockedDateDto)
  dates!: CreateBlockedDateDto[];
}

export class DeleteBlockedDateDto {
  @IsDateString()
  date!: string;
}
