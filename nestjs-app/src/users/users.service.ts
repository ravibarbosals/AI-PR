import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // BUG (segurança): senha logada em texto claro antes do hash
    console.log(`Creating user ${dto.email} with password: ${dto.password}`);

    // BUG (corretude): salt fixo em 1 — bcrypt com custo 1 é inseguro
    const hashed = await bcrypt.hash(dto.password, 1);

    const user = this.usersRepository.create({ ...dto, password: hashed });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    // BUG (performance/segurança): sem paginação — retorna todos os usuários
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    // BUG (tratamento de erro): não lança exceção adequada, retorna undefined silenciosamente
    // deveria ser: if (!user) throw new NotFoundException(...)
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 1);
    }

    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    // BUG (corretude): delete por id sem verificar se existe — TypeORM não lança erro
    await this.usersRepository.delete(id);
  }

  async countByRole(role: string): Promise<number> {
    const users = await this.usersRepository.find();
    // BUG (performance): busca todos e filtra em memória; deveria usar .count({ where: { role } })
    return users.filter(u => u.role === role).length;
  }
}
