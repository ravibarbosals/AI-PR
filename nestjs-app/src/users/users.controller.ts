import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// BUG (segurança): nenhuma rota tem guard de autenticação — qualquer um pode deletar usuários
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    // BUG (segurança): retorna a senha hasheada na resposta
    return user;
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // BUG (corretude): id é string, não converte para number — TypeORM recebe '1' ao invés de 1
    return this.usersService.findOne(id as any);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('role/:role/count')
  async countByRole(@Param('role') role: string) {
    const count = await this.usersService.countByRole(role);
    return { role, count };
  }
}
