import { IsNotEmpty, IsString, IsEmail, IsIn } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'admin'])
  role: string;
}

export class UpdateCustomerDto {
  @IsString()
  name?: string;

  @IsEmail()
  email?: string;

  @IsString()
  password?: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
