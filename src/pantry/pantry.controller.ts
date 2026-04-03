import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	ParseUUIDPipe,
	Post,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreatePantryItemsBulkDto } from './dto/create-pantry-items-bulk.dto';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryService } from './pantry.service';

@ApiTags('pantry')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('pantry')
export class PantryController {
	constructor(private readonly pantryService: PantryService) {}

	@Post()
	@ApiOperation({ summary: 'Add pantry item for current user' })
	@ApiCreatedResponse({ description: 'Pantry item created successfully' })
	create(
		@Body() createPantryItemDto: CreatePantryItemDto,
		@CurrentUserId() userId: string,
	) {
		return this.pantryService.create(createPantryItemDto, userId);
	}

	@Post('bulk')
	@ApiOperation({ summary: 'Bulk add pantry items for current user' })
	@ApiCreatedResponse({ description: 'Pantry items created successfully' })
	createBulk(
		@Body() createPantryItemsBulkDto: CreatePantryItemsBulkDto,
		@CurrentUserId() userId: string,
	) {
		return this.pantryService.createBulk(createPantryItemsBulkDto, userId);
	}

	@Get()
	@ApiOperation({ summary: 'Get pantry items for current user' })
	@ApiOkResponse({ description: 'Pantry items returned successfully' })
	findAll(@CurrentUserId() userId: string) {
		return this.pantryService.findAll(userId);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update pantry item for current user' })
	@ApiParam({ name: 'id', description: 'Pantry item UUID' })
	@ApiOkResponse({ description: 'Pantry item updated successfully' })
	update(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Body() updatePantryItemDto: UpdatePantryItemDto,
		@CurrentUserId() userId: string,
	) {
		return this.pantryService.update(id, updatePantryItemDto, userId);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete one pantry item for current user' })
	@ApiParam({ name: 'id', description: 'Pantry item UUID' })
	@ApiNoContentResponse({ description: 'Pantry item deleted successfully' })
	remove(
		@Param('id', new ParseUUIDPipe()) id: string,
		@CurrentUserId() userId: string,
	) {
		return this.pantryService.remove(id, userId);
	}

	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Clear all pantry items for current user' })
	@ApiNoContentResponse({ description: 'Pantry cleared successfully' })
	clear(@CurrentUserId() userId: string) {
		return this.pantryService.clear(userId);
	}
}
