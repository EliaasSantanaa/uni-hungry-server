import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertHeartbeat(userId: string, dto: UpdatePresenceDto) {
    const now = new Date();

    const presence = await this.prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        lastSeenAt: now,
      },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        lastSeenAt: now,
      },
    });

    return {
      success: true,
      lastSeenAt: presence.lastSeenAt,
    };
  }

  async goOffline(userId: string) {
    await this.prisma.userPresence.deleteMany({
      where: { userId },
    });

    return { success: true };
  }

  async getOnlineUsers() {
    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    const presences = await this.prisma.userPresence.findMany({
      where: {
        lastSeenAt: { gte: threshold },
      },
      include: {
        user: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return {
      total: presences.length,
      onlineThresholdMinutes: ONLINE_THRESHOLD_MS / 60_000,
      users: presences.map((presence) => ({
        userId: presence.user.id,
        name: presence.user.name,
        email: presence.user.email,
        role: presence.user.role,
        restaurant: presence.user.restaurant
          ? {
              id: presence.user.restaurant.id,
              name: presence.user.restaurant.name,
            }
          : null,
        latitude: presence.latitude,
        longitude: presence.longitude,
        accuracy: presence.accuracy,
        lastSeenAt: presence.lastSeenAt,
        isOnline: true,
      })),
    };
  }
}
