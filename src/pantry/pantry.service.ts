import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePantryItemsBulkDto } from './dto/create-pantry-items-bulk.dto';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';

@Injectable()
export class PantryService {
	constructor(private readonly prisma: PrismaService) {}

	create(createPantryItemDto: CreatePantryItemDto, userId: string) {
		const normalizedName = createPantryItemDto.name.trim().toLowerCase();

		return this.createUniquePantryItem(normalizedName, userId);
	}

	private async createUniquePantryItem(name: string, userId: string) {
		const existing = await this.prisma.pantryItem.findFirst({
			where: {
				userId,
				name,
			},
			select: { id: true },
		});

		if (existing) {
			throw new ConflictException(`Pantry item '${name}' already exists`);
		}

		return this.prisma.pantryItem.create({
			data: {
				name,
				userId,
			},
		});
	}

	async createBulk(createPantryItemsBulkDto: CreatePantryItemsBulkDto, userId: string) {
		const normalizedUniqueNames = [...new Set(createPantryItemsBulkDto.items.map((item) => item.trim().toLowerCase()))];

		const existingItems = await this.prisma.pantryItem.findMany({
			where: {
				userId,
				name: {
					in: normalizedUniqueNames,
				},
			},
			select: { name: true },
		});

		const existingSet = new Set(existingItems.map((item) => item.name));
		const namesToCreate = normalizedUniqueNames.filter((name) => !existingSet.has(name));

		if (namesToCreate.length > 0) {
			await this.prisma.pantryItem.createMany({
				data: namesToCreate.map((name) => ({ name, userId })),
			});
		}

		return this.findAll(userId);
	}

	findAll(userId: string) {
		return this.prisma.pantryItem.findMany({
			where: {
				userId,
			},
			orderBy: {
				id: 'desc',
			},
		});
	}

	async update(id: string, updatePantryItemDto: UpdatePantryItemDto, userId: string) {
		const normalizedName = updatePantryItemDto.name.trim().toLowerCase();

		const duplicate = await this.prisma.pantryItem.findFirst({
			where: {
				userId,
				name: normalizedName,
				NOT: {
					id,
				},
			},
			select: { id: true },
		});

		if (duplicate) {
			throw new ConflictException(`Pantry item '${normalizedName}' already exists`);
		}

		const result = await this.prisma.pantryItem.updateMany({
			where: {
				id,
				userId,
			},
			data: {
				name: normalizedName,
			},
		});

		if (result.count === 0) {
			throw new NotFoundException(`Pantry item with ID ${id} not found`);
		}

		return this.prisma.pantryItem.findFirst({
			where: {
				id,
				userId,
			},
		});
	}

	async remove(id: string, userId: string): Promise<void> {
		const result = await this.prisma.pantryItem.deleteMany({
			where: {
				id,
				userId,
			},
		});

		if (result.count === 0) {
			throw new NotFoundException(`Pantry item with ID ${id} not found`);
		}
	}

	async clear(userId: string): Promise<void> {
		await this.prisma.pantryItem.deleteMany({
			where: {
				userId,
			},
		});
	}
}
