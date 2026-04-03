import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserEmail } from '../auth/current-user-email.decorator';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CurrentUserName } from '../auth/current-user-name.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Profile returned successfully' })
  getProfile(
    @CurrentUserId() userId: string,
    @CurrentUserEmail() userEmail: string | null,
    @CurrentUserName() userName: string | null,
  ) {
    return this.profileService.getProfile(userId, userEmail, userName);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  updateProfile(
    @CurrentUserId() userId: string,
    @CurrentUserEmail() userEmail: string | null,
    @CurrentUserName() userName: string | null,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(
      userId,
      userEmail,
      userName,
      updateProfileDto,
    );
  }
}
