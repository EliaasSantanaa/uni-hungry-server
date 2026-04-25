import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/database/prisma.module';
import { AuthModule } from 'src/module/auth/auth.module';
import { ResendModule } from 'src/module/resend/resend.module';
import { UsersModule } from 'src/module/users/users.module';
import { DashboardModule } from 'src/module/dashboard/dashboard.module';
import { RestaurantsModule } from 'src/module/restaurants/restaurants.module';
import { MetricsModule } from 'src/module/metrics/metrics.module';
import { MenuModule } from 'src/module/menu/menu.module';
import { TabsModule } from 'src/module/tabs/tabs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ResendModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    RestaurantsModule,
    MetricsModule,
    MenuModule,
    TabsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
