import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { PresenceService } from './presence.service';

@ApiTags('Presence')
@ApiBearerAuth('JWT')
@Controller('presence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post('heartbeat')
  @ApiOperation({
    summary: 'Atualiza localização e status online do usuário autenticado',
  })
  @ApiOkResponse({ description: 'Presença atualizada' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou ausente' })
  async heartbeat(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdatePresenceDto,
  ) {
    return this.presenceService.upsertHeartbeat(user.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove presença do usuário (logout / offline)' })
  async goOffline(@CurrentUser() user: CurrentUserData) {
    return this.presenceService.goOffline(user.id);
  }

  @Get('online')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lista usuários online com localização (ADMIN)' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a ADMIN' })
  async getOnlineUsers() {
    return this.presenceService.getOnlineUsers();
  }
}
