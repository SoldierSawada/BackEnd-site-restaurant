import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReservationCommand {
  @IsString()
  @MinLength(1)
  reservationDate!: string;

  @IsString()
  @MinLength(1)
  startTime!: string;

  @IsString()
  @MinLength(1)
  endTime!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  guestCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequest?: string;
}

export class GuestReservationCommand {
  @IsString()
  @MinLength(1)
  reservationDate!: string;

  @IsString()
  @MinLength(1)
  startTime!: string;

  @IsString()
  @MinLength(1)
  endTime!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  guestCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequest?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  guestName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(254)
  guestEmail!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  guestPhone!: string;
}

export class AvailableTablesQuery {
  @IsString()
  @MinLength(1)
  reservationDate!: string;

  @IsString()
  @MinLength(1)
  startTime!: string;

  @IsString()
  @MinLength(1)
  endTime!: string;

  @IsInt()
  @Min(1)
  guestCount!: number;
}