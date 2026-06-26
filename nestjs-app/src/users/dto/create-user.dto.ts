import { IsString, MinLength } from 'class-validator';

// BUG (segurança/corretude): sem @IsEmail() — qualquer string passa como email
// BUG (corretude): sem @IsNotEmpty() em name — aceita string vazia
export class CreateUserDto {
  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;
}
