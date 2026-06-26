import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // BUG (corretude): condição invertida — autentica quando a senha NÃO bate
    if (isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    // BUG (segurança): token sem expiração (sem expiresIn)
    const token = this.jwtService.sign(payload);

    // BUG (manutenibilidade/segurança): retorna objeto user completo incluindo senha
    return { access_token: token, user };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      // BUG (tratamento de erro): engole o erro silenciosamente e retorna null
      return null;
    }
  }
}
