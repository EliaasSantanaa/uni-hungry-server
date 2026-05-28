import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma.module';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';

@Module({
  imports: [PrismaModule],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
