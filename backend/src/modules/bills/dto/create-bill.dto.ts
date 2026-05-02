import { IsOptional, IsString } from 'class-validator';

export class CreateBillDto {
  @IsString()
  @IsOptional()
  title?: string;
}
