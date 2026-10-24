import { IsIn, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { menuCategorySlugs } from 'restaurant-core';

export class MenuItemCommand {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsIn(menuCategorySlugs)
  category!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999)
  price!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;
}
