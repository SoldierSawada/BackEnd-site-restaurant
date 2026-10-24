import { IsString, MaxLength, MinLength } from 'class-validator';

export class BlogArticleCommand {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  category!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  excerpt!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  author!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content!: string;
}
