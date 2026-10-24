import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateTableCommand {
  @IsInt()
  @Min(1)
  number!: number;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  @MinLength(1)
  location!: string;
}

export class SetTableActiveCommand {
  @IsBoolean()
  active!: boolean;
}

export class PageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}
