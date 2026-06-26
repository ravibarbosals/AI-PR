import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    // BUG (segurança): secret hardcoded e fraco
    JwtModule.register({
      secret: 'secret',
      signOptions: {},
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
