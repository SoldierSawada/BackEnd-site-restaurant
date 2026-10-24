import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SubmitReviewCommand {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class ReplyReviewCommand {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

export class ReviewPageQuery {
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @Min(1)
  @Max(50)
  pageSize: number = 10;
}
