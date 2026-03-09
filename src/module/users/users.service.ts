import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: PrismaService) {}

  async findAll() {
    const users = await this.db.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      users,
      total: users.length,
    };
  }

  async findOne(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verifica se o usuário existe
    await this.findOne(id);

    const updatedUser = await this.db.user.update({
      where: { id },
      data: updateUserDto,
    });

    this.logger.log(`Usuário ${id} atualizado com sucesso`);

    return updatedUser;
  }

  async remove(id: string) {
    // Verifica se o usuário existe
    await this.findOne(id);

    await this.db.user.delete({
      where: { id },
    });

    this.logger.log(`Usuário ${id} removido com sucesso`);

    return {
      success: true,
      message: 'Usuário removido com sucesso',
    };
  }
}
