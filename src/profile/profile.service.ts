import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(
    userId: string,
    userEmail: string | null,
    userName: string | null,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    return {
      id: userId,
      email: profile?.email ?? userEmail,
      name: profile?.name ?? userName ?? null,
    };
  }

  async updateProfile(
    userId: string,
    userEmail: string | null,
    userName: string | null,
    updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        ...(updateProfileDto.name !== undefined ? { name: updateProfileDto.name } : {}),
        ...(userEmail ? { email: userEmail } : {}),
      },
      create: {
        userId,
        name: updateProfileDto.name ?? userName ?? null,
        email: userEmail,
      },
    });

    return {
      id: profile.userId,
      email: profile.email,
      name: profile.name,
    };
  }
}
