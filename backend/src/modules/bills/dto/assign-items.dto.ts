import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class AssignmentDto {
  @IsUUID()
  itemId: string;

  @IsUUID()
  participantId: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  ratio: number;
}

export class AssignItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentDto)
  assignments: AssignmentDto[];
}
