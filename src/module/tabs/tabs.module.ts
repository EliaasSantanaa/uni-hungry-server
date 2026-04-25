import { Module } from '@nestjs/common';
import { TabsController } from './tabs.controller';
import { TabsService } from './tabs.service';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TabsController],
  providers: [TabsService],
  exports: [TabsService],
})
export class TabsModule {}
