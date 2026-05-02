import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AddParticipantDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  guestName?: string;
}
