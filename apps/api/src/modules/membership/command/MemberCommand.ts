import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileCommand {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;
}

export class ChangePasswordCommand {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class RegisterMemberCommand {
  @IsString()
  @MinLength(1)
  name!: string;

  // Le format exact est validé par le Value Object Email (InvalidEmailError).
  @IsString()
  @MinLength(1)
  email!: string;

  // Longueur minimale contrôlée aussi par le Use Case RegisterMember (WeakPasswordError).
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginCommand {
  @IsString()
  @MinLength(1)
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
