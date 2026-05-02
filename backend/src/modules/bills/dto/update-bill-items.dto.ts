import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class BillItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  price: number;
}

export class UpdateBillItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @IsInt()
  @Min(0)
  taxAmount: number;

  @IsInt()
  @Min(0)
  serviceChargeAmount: number;
}
