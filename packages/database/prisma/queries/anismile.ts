import { db } from "../client";
import { Prisma } from "../generated/client";

const DEFAULT_MARKUP_KEY = "default_markup";
const DEFAULT_MARKUP_VALUE = "1.2";
const SYNC_CURSOR_KEY = "sync.cursor";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const;
export type AnismileOrderStatus = (typeof ORDER_STATUSES)[number];

export type ProductSyncInput = {
	supplierId: string;
	sourceUrl?: string | null;
	titleOriginal: string;
	titleTranslated: string;
	descriptionOriginal?: string | null;
	descriptionTranslated?: string | null;
	imageUrls: string[];
	category?: string | null;
	series?: string | null;
	originalPrice?: number | null;
	costPrice: number;
	markupOverride?: number | null;
	listingDate?: Date | null;
	orderDeadline?: Date | null;
	stockQuantity?: number | null;
	lastSyncedAt: Date;
	discountRate?: number | null;
	brand?: string | null;
	franchise?: string | null;
	janCode?: string | null;
	releaseDate?: Date | null;
};

export function calculateSellingPrice({
	costPrice,
	markup,
}: {
	costPrice: Prisma.Decimal;
	markup: Prisma.Decimal;
}) {
	return costPrice.mul(markup).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export async function ensureDefaultMarkupSetting() {
	return await db.anismileSetting.upsert({
		where: {
			key: DEFAULT_MARKUP_KEY,
		},
		create: {
			key: DEFAULT_MARKUP_KEY,
			value: DEFAULT_MARKUP_VALUE,
		},
		update: {},
	});
}

export async function getDefaultMarkup() {
	const setting = await ensureDefaultMarkupSetting();
	return new Prisma.Decimal(setting.value || DEFAULT_MARKUP_VALUE);
}

export async function getSyncCursor() {
	const setting = await db.anismileSetting.findUnique({
		where: {
			key: SYNC_CURSOR_KEY,
		},
	});
	const value = Number.parseInt(setting?.value ?? "0", 10);
	return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function setSyncCursor(offset: number) {
	const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.floor(offset) : 0;
	await db.anismileSetting.upsert({
		where: {
			key: SYNC_CURSOR_KEY,
		},
		create: {
			key: SYNC_CURSOR_KEY,
			value: String(safeOffset),
		},
		update: {
			value: String(safeOffset),
		},
	});
}

export async function getTierSettingsValues(): Promise<{
	wholesaleDiscount: number;
	vipDiscount: number;
	wholesaleThreshold: number;
	vipThreshold: number;
}> {
	const defaults = {
		wholesaleDiscount: 0.03,
		vipDiscount: 0.05,
		wholesaleThreshold: 5_000_000,
		vipThreshold: 10_000_000,
	} as const;

	const settings = await db.anismileSetting.findMany({
		where: {
			key: {
				in: [
					"tier_wholesale_discount",
					"tier_vip_discount",
					"tier_wholesale_threshold",
					"tier_vip_threshold",
				],
			},
		},
		select: {
			key: true,
			value: true,
		},
	});

	const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));
	const parseWithFallback = (key: string, fallback: number) => {
		const value = settingsMap.get(key);
		if (!value) return fallback;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	};

	return {
		wholesaleDiscount: parseWithFallback("tier_wholesale_discount", defaults.wholesaleDiscount),
		vipDiscount: parseWithFallback("tier_vip_discount", defaults.vipDiscount),
		wholesaleThreshold: parseWithFallback("tier_wholesale_threshold", defaults.wholesaleThreshold),
		vipThreshold: parseWithFallback("tier_vip_threshold", defaults.vipThreshold),
	};
}

export async function listAnismileProducts({
	page = 1,
	pageSize = 20,
	category,
	series,
	search,
	listingDate,
	onlyInStock = true,
	urgentDeadline,
	showUnavailable,
}: {
	page?: number;
	pageSize?: number;
	category?: string;
	series?: string;
	search?: string;
	listingDate?: Date;
	onlyInStock?: boolean;
	urgentDeadline?: boolean;
	showUnavailable?: boolean;
}) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const urgentEnd = new Date(today);
	urgentEnd.setDate(urgentEnd.getDate() + 7);

	const andConditions: Prisma.AnismileProductWhereInput[] = [];

	if (search) {
		andConditions.push({
			OR: [
				{ titleOriginal: { contains: search, mode: "insensitive" } },
				{ titleTranslated: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (!showUnavailable) {
		andConditions.push({ OR: [{ orderDeadline: null }, { orderDeadline: { gte: today } }] });
	}

	const where: Prisma.AnismileProductWhereInput = {
		inStock: onlyInStock ? true : undefined,
		category: category ? category : undefined,
		series: series ? { startsWith: series } : undefined,
		listingDate: listingDate
			? { gte: listingDate, lt: new Date(listingDate.getTime() + 24 * 60 * 60 * 1000) }
			: undefined,
		...(urgentDeadline ? { orderDeadline: { gte: today, lte: urgentEnd } } : {}),
		...(andConditions.length ? { AND: andConditions } : {}),
	};

	const [items, total] = await Promise.all([
		db.anismileProduct.findMany({
			where,
			orderBy: [{ listingDate: "desc" }, { createdAt: "desc" }],
			take: pageSize,
			skip: (page - 1) * pageSize,
		}),
		db.anismileProduct.count({ where }),
	]);

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
}

export async function listLatestAnismileProducts(limit = 20) {
	return await db.anismileProduct.findMany({
		where: {
			inStock: true,
		},
		orderBy: [{ listingDate: "desc" }, { createdAt: "desc" }],
		take: limit,
	});
}

export async function getAnismileProductById(id: string) {
	return await db.anismileProduct.findUnique({
		where: { id },
	});
}

export async function listAnismileCategories() {
	const groups = await db.anismileProduct.groupBy({
		by: ["category"],
		where: {
			inStock: true,
			category: {
				not: null,
			},
		},
		_count: {
			_all: true,
		},
		orderBy: {
			_count: {
				category: "desc",
			},
		},
	});

	return groups.map((item) => ({
		name: item.category as string,
		count: item._count._all,
	}));
}

export async function listAnismileSeries() {
	const groups = await db.anismileProduct.groupBy({
		by: ["series"],
		where: {
			inStock: true,
			series: {
				not: null,
			},
		},
		_count: {
			_all: true,
		},
		orderBy: {
			_count: {
				series: "desc",
			},
		},
	});

	return groups.map((item) => ({
		name: item.series as string,
		count: item._count._all,
	}));
}

export async function setProductMarkupOverride({
	productId,
	markupOverride,
}: {
	productId: string;
	markupOverride: number | null;
}) {
	const product = await db.anismileProduct.findUnique({
		where: { id: productId },
		select: {
			id: true,
			costPrice: true,
		},
	});

	if (!product) {
		throw new Error("Product not found");
	}

	const defaultMarkup = await getDefaultMarkup();
	const effectiveMarkup = markupOverride === null ? defaultMarkup : new Prisma.Decimal(markupOverride);
	const sellingPrice = calculateSellingPrice({
		costPrice: product.costPrice,
		markup: effectiveMarkup,
	});

	return await db.anismileProduct.update({
		where: { id: productId },
		data: {
			markupOverride: markupOverride === null ? null : new Prisma.Decimal(markupOverride),
			sellingPrice,
		},
	});
}

export async function setDefaultMarkup({
	markup,
}: {
	markup: number;
}) {
	const markupDecimal = new Prisma.Decimal(markup);

	await db.anismileSetting.upsert({
		where: {
			key: DEFAULT_MARKUP_KEY,
		},
		create: {
			key: DEFAULT_MARKUP_KEY,
			value: markupDecimal.toString(),
		},
		update: {
			value: markupDecimal.toString(),
		},
	});

	const products = await db.anismileProduct.findMany({
		select: {
			id: true,
			costPrice: true,
			markupOverride: true,
		},
	});

	const chunkSize = 100;
	for (let i = 0; i < products.length; i += chunkSize) {
		const chunk = products.slice(i, i + chunkSize);
		await db.$transaction(
			chunk.map((product) => {
				const effectiveMarkup = product.markupOverride ?? markupDecimal;
				const sellingPrice = calculateSellingPrice({
					costPrice: product.costPrice,
					markup: effectiveMarkup,
				});
				return db.anismileProduct.update({
					where: { id: product.id },
					data: { sellingPrice },
				});
			}),
		);
	}

	return {
		markup: markupDecimal,
	};
}

export async function createSyncLog() {
	return await db.anismileSyncLog.create({
		data: {
			startedAt: new Date(),
			status: "running",
		},
	});
}

export async function finishSyncLog({
	id,
	status,
	productsSynced,
	productsAdded,
	productsUpdated,
	productsSkipped = 0,
	productsFailed = 0,
	errorMessage,
}: {
	id: string;
	status: "completed" | "failed";
	productsSynced: number;
	productsAdded: number;
	productsUpdated: number;
	productsSkipped?: number;
	productsFailed?: number;
	errorMessage?: string;
}) {
	return await db.anismileSyncLog.update({
		where: { id },
		data: {
			status,
			productsSynced,
			productsAdded,
			productsUpdated,
			productsSkipped,
			productsFailed,
			errorMessage,
			finishedAt: new Date(),
		},
	});
}

export async function listSyncLogs(limit = 20) {
	return await db.anismileSyncLog.findMany({
		orderBy: {
			startedAt: "desc",
		},
		take: limit,
	});
}

export async function upsertProductsFromSync(
	products: ProductSyncInput[],
	options: {
		markMissingOutOfStock?: boolean;
		transactionTimeoutMs?: number;
	} = {},
) {
	const { markMissingOutOfStock = true, transactionTimeoutMs = 60_000 } = options;
	const defaultMarkup = await getDefaultMarkup();
	const now = new Date();
	const supplierIds = products.map((item) => item.supplierId);

	let productsAdded = 0;
	let productsUpdated = 0;
	let productsSkipped = 0;

	await db.$transaction(async (tx) => {
		for (const product of products) {
			const existing = await tx.anismileProduct.findUnique({
				where: {
					supplierId: product.supplierId,
				},
				select: {
					id: true,
					markupOverride: true,
					listingDate: true,
					priceManualOverride: true,
				},
			});

			const costPrice = new Prisma.Decimal(product.costPrice);
			const markupOverride =
				product.markupOverride === null || product.markupOverride === undefined
					? null
					: new Prisma.Decimal(product.markupOverride);
			const effectiveMarkup = markupOverride ?? existing?.markupOverride ?? defaultMarkup;
			const sellingPrice = calculateSellingPrice({
				costPrice,
				markup: effectiveMarkup,
			});

			await tx.anismileProduct.upsert({
				where: {
					supplierId: product.supplierId,
				},
				create: {
					supplierId: product.supplierId,
					sourceUrl: product.sourceUrl ?? null,
					titleOriginal: product.titleOriginal,
					titleTranslated: product.titleTranslated,
					descriptionOriginal: product.descriptionOriginal,
					descriptionTranslated: product.descriptionTranslated,
					imageUrls: product.imageUrls,
					category: product.category,
					series: product.series,
					originalPrice:
						product.originalPrice === null || product.originalPrice === undefined
							? null
							: new Prisma.Decimal(product.originalPrice),
					costPrice,
					markupOverride,
					sellingPrice,
					listingDate: product.listingDate ?? now,
					orderDeadline: product.orderDeadline,
					inStock: product.stockQuantity != null ? product.stockQuantity > 0 : true,
					stockQuantity: product.stockQuantity ?? null,
					lastSyncedAt: product.lastSyncedAt,
					discountRate: product.discountRate != null ? new Prisma.Decimal(product.discountRate / 100) : null,
					brand: product.brand ?? null,
					franchise: product.franchise ?? null,
					janCode: product.janCode ?? null,
					releaseDate: product.releaseDate ?? null,
				},
				update: {
					titleOriginal: product.titleOriginal,
					sourceUrl: product.sourceUrl ?? null,
					titleTranslated: product.titleTranslated,
					descriptionOriginal: product.descriptionOriginal,
					descriptionTranslated: product.descriptionTranslated,
					imageUrls: product.imageUrls,
					category: product.category,
					series: product.series,
					originalPrice:
						product.originalPrice === null || product.originalPrice === undefined
							? null
							: new Prisma.Decimal(product.originalPrice),
					costPrice,
					...(existing?.priceManualOverride ? {} : { markupOverride, sellingPrice }),
					listingDate: existing?.listingDate ?? product.listingDate ?? now,
					orderDeadline: product.orderDeadline,
					inStock: product.stockQuantity != null ? product.stockQuantity > 0 : true,
					stockQuantity: product.stockQuantity ?? null,
					lastSyncedAt: product.lastSyncedAt,
					discountRate: product.discountRate != null ? new Prisma.Decimal(product.discountRate / 100) : null,
					brand: product.brand ?? null,
					franchise: product.franchise ?? null,
					janCode: product.janCode ?? null,
					releaseDate: product.releaseDate ?? null,
				},
			});

			if (existing) {
				productsUpdated += 1;
			} else {
				productsAdded += 1;
			}
		}

		if (markMissingOutOfStock) {
			const skippedResult = await tx.anismileProduct.updateMany({
				where: {
					supplierId: {
						notIn: supplierIds.length > 0 ? supplierIds : ["__none__"],
					},
				},
				data: {
					inStock: false,
				},
			});
			productsSkipped = skippedResult.count;
		}
	}, { timeout: transactionTimeoutMs, maxWait: 10_000 });

	return {
		productsSynced: products.length,
		productsAdded,
		productsUpdated,
		productsSkipped,
	};
}

export async function addToCart({
	userId,
	productId,
	quantity,
}: {
	userId: string;
	productId: string;
	quantity: number;
}) {
	const product = await db.anismileProduct.findUnique({
		where: { id: productId },
		select: {
			id: true,
			inStock: true,
			orderDeadline: true,
		},
	});

	if (!product || !product.inStock) {
		throw new Error("Product unavailable");
	}
	if (product.orderDeadline && product.orderDeadline.getTime() < Date.now()) {
		throw new Error("Product order deadline has passed");
	}

	return await db.anismileCartItem.upsert({
		where: {
			userId_productId: {
				userId,
				productId,
			},
		},
		create: {
			userId,
			productId,
			quantity,
		},
		update: {
			quantity: {
				increment: quantity,
			},
		},
		include: {
			product: true,
		},
	});
}

export async function listCartItems(userId: string) {
	const items = await db.anismileCartItem.findMany({
		where: { userId },
		include: {
			product: true,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	const cartTotal = items.reduce(
		(total, item) => total.plus(item.product.sellingPrice.mul(item.quantity)),
		new Prisma.Decimal(0),
	);

	return {
		items: items.map((item) => ({
			...item,
			lineTotal: item.product.sellingPrice.mul(item.quantity),
		})),
		cartTotal,
	};
}

export async function removeCartItem({
	itemId,
	userId,
}: {
	itemId: string;
	userId: string;
}) {
	const item = await db.anismileCartItem.findUnique({
		where: {
			id: itemId,
		},
	});

	if (!item || item.userId !== userId) {
		throw new Error("Cannot remove this cart item");
	}

	await db.anismileCartItem.delete({
		where: {
			id: itemId,
		},
	});

	return { ok: true };
}

export async function updateCartItemQuantity({
	itemId,
	userId,
	quantity,
}: {
	itemId: string;
	userId: string;
	quantity: number;
}) {
	const item = await db.anismileCartItem.findUnique({
		where: { id: itemId },
	});

	if (!item || item.userId !== userId) {
		throw new Error("Cannot update this cart item");
	}

	await db.anismileCartItem.update({
		where: { id: itemId },
		data: { quantity },
	});

	return { ok: true };
}

export async function createOrderFromCart({
	userId,
	shippingName,
	shippingPhone,
	shippingAddress,
	notes,
}: {
	userId: string;
	shippingName: string;
	shippingPhone: string;
	shippingAddress: string;
	notes?: string;
}) {
	const tierSettings = await getTierSettingsValues();

	const userRecord = await db.user.findUnique({
		where: { id: userId },
		select: { anismileTier: true },
	});
	const tierDiscountRate = new Prisma.Decimal(
		userRecord?.anismileTier === "VIP"
			? tierSettings.vipDiscount
			: userRecord?.anismileTier === "WHOLESALE"
				? tierSettings.wholesaleDiscount
				: 0,
	);

	return await db.$transaction(async (tx) => {
		const cartItems = await tx.anismileCartItem.findMany({
			where: {
				userId,
			},
			include: {
				product: true,
			},
		});

		if (cartItems.length === 0) {
			throw new Error("Cart is empty");
		}

		const totalAmount = cartItems.reduce(
			(total, item) => total.plus(item.product.sellingPrice.mul(item.quantity)),
			new Prisma.Decimal(0),
		);

		const order = await tx.anismileOrder.create({
			data: {
				userId,
				totalAmount,
				shippingName,
				shippingPhone,
				shippingAddress,
				notes,
				items: {
					create: cartItems.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: item.product.sellingPrice,
						costPrice: item.product.costPrice,
						tierDiscountRate,
					})),
				},
			},
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		});

		await tx.anismileCartItem.deleteMany({
			where: {
				userId,
			},
		});

		return order;
	});
}

export async function listOrders({
	userId,
	isAdmin,
	status,
	dateFrom,
	dateTo,
	page = 1,
	pageSize = 20,
}: {
	userId: string;
	isAdmin: boolean;
	status?: string;
	dateFrom?: Date;
	dateTo?: Date;
	page?: number;
	pageSize?: number;
}) {
	const where: Prisma.AnismileOrderWhereInput = {
		userId: isAdmin ? undefined : userId,
		status: status || undefined,
		createdAt:
			dateFrom || dateTo
				? {
					gte: dateFrom,
					lte: dateTo,
				}
				: undefined,
	};

	const [items, total] = await Promise.all([
		db.anismileOrder.findMany({
			where,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				items: {
					include: {
						product: {
							select: {
								id: true,
								titleTranslated: true,
								titleOriginal: true,
								supplierId: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: pageSize,
			skip: (page - 1) * pageSize,
		}),
		db.anismileOrder.count({ where }),
	]);

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
}

export async function getAdminDashboardStats() {
	const monthStart = new Date();
	monthStart.setDate(1);
	monthStart.setHours(0, 0, 0, 0);

	const [pendingOrders, monthlyRevenue, productCount, latestSync] = await Promise.all([
		db.anismileOrder.count({
			where: {
				status: "pending",
			},
		}),
		db.anismileOrder.aggregate({
			_sum: {
				totalAmount: true,
			},
			where: {
				createdAt: {
					gte: monthStart,
				},
				status: {
					not: "cancelled",
				},
			},
		}),
		db.anismileProduct.count(),
		db.anismileSyncLog.findFirst({
			orderBy: {
				startedAt: "desc",
			},
		}),
	]);

	return {
		pendingOrders,
		monthlyRevenue: monthlyRevenue._sum.totalAmount ?? new Prisma.Decimal(0),
		productCount,
		lastSyncAt: latestSync?.finishedAt ?? latestSync?.startedAt ?? null,
		syncStatus: latestSync?.status ?? "idle",
	};
}

export async function getOrderById(id: string) {
	return await db.anismileOrder.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			items: {
				include: {
					product: true,
				},
			},
		},
	});
}

function canTransition(current: string, next: string) {
	if (next === "cancelled") {
		return true;
	}

	const map: Record<string, string> = {
		pending: "confirmed",
		confirmed: "shipped",
		shipped: "completed",
	};

	return map[current] === next;
}

export async function updateOrderStatus({
	orderId,
	status,
}: {
	orderId: string;
	status: AnismileOrderStatus;
}) {
	const order = await db.anismileOrder.findUnique({
		where: {
			id: orderId,
		},
	});

	if (!order) {
		throw new Error("Order not found");
	}

	if (order.status === status) {
		return order;
	}

	if (!canTransition(order.status, status)) {
		throw new Error(`Invalid transition from ${order.status} to ${status}`);
	}

	return await db.anismileOrder.update({
		where: {
			id: orderId,
		},
		data: {
			status,
		},
	});
}

export async function updateUserRole({
	userId,
	role,
}: {
	userId: string;
	role: "customer" | "admin" | "super_admin";
}) {
	return await db.user.update({
		where: {
			id: userId,
		},
		data: {
			role,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
		},
	});
}

export async function listUsersForRoleManagement() {
	return await db.user.findMany({
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			createdAt: true,
		},
	});
}

export async function getOrdersForExport({
	status,
	startDate,
	endDate,
}: {
	status?: string;
	startDate?: Date;
	endDate?: Date;
}) {
	return await db.anismileOrder.findMany({
		where: {
			status: status || undefined,
			createdAt:
				startDate || endDate
					? {
						gte: startDate,
						lte: endDate,
					}
					: undefined,
		},
		include: {
			user: {
				select: {
					name: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							titleTranslated: true,
							titleOriginal: true,
							supplierId: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function listAnismileCustomers({
	search,
	page = 1,
	pageSize = 20,
}: {
	search?: string;
	page?: number;
	pageSize?: number;
}) {
	const where = search
		? {
				anismileOrders: { some: {} },
				OR: [
					{ name: { contains: search, mode: "insensitive" as const } },
					{ email: { contains: search, mode: "insensitive" as const } },
				],
			}
		: { anismileOrders: { some: {} } };

	const [customers, total] = await Promise.all([
		db.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				email: true,
				anismileTier: true,
				_count: { select: { anismileOrders: true } },
				anismileOrders: {
					orderBy: { createdAt: "desc" },
					take: 1,
					select: { createdAt: true },
				},
			},
			orderBy: { name: "asc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.user.count({ where }),
	]);

	return {
		customers: customers.map((c) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			tier: (c.anismileTier ?? "NORMAL") as "NORMAL" | "WHOLESALE" | "VIP",
			orderCount: c._count.anismileOrders,
			lastOrderAt: c.anismileOrders[0]?.createdAt ?? null,
		})),
		total,
	};
}

export async function searchAnismileProducts({
	query,
	filters,
	sort = "relevance",
	page = 1,
	perPage = 20,
}: {
	query: string;
	filters?: {
		category?: string;
		franchise?: string;
		brand?: string;
	};
	sort?: string;
	page?: number;
	perPage?: number;
}) {
	const isJanCode = /^\d{8,14}$/.test(query.trim());

	const baseWhere: Prisma.AnismileProductWhereInput = {
		...(filters?.category ? { category: filters.category } : {}),
		...(filters?.franchise ? { franchise: filters.franchise } : {}),
		...(filters?.brand ? { brand: filters.brand } : {}),
		...(isJanCode
			? { janCode: { contains: query.trim(), mode: "insensitive" as const } }
			: {
					OR: [
						{ titleOriginal: { contains: query, mode: "insensitive" as const } },
						{ titleTranslated: { contains: query, mode: "insensitive" as const } },
						{ franchise: { contains: query, mode: "insensitive" as const } },
						{ brand: { contains: query, mode: "insensitive" as const } },
					],
				}),
	};

	const orderBy: Prisma.AnismileProductOrderByWithRelationInput[] =
		sort === "price_asc"
			? [{ sellingPrice: "asc" }]
			: sort === "price_desc"
				? [{ sellingPrice: "desc" }]
				: sort === "deadline"
					? [{ orderDeadline: { sort: "asc", nulls: "last" } }]
					: sort === "newest"
						? [{ listingDate: "desc" }]
						: [{ listingDate: "desc" }, { createdAt: "desc" }];

	const [items, total, catFacets, franchiseFacets, brandFacets] = await Promise.all([
		db.anismileProduct.findMany({
			where: baseWhere,
			orderBy,
			take: perPage,
			skip: (page - 1) * perPage,
		}),
		db.anismileProduct.count({ where: baseWhere }),
		db.anismileProduct.groupBy({
			by: ["category"],
			where: { ...baseWhere, category: { not: null } },
			_count: { _all: true },
		}),
		db.anismileProduct.groupBy({
			by: ["franchise"],
			where: { ...baseWhere, franchise: { not: null } },
			_count: { _all: true },
		}),
		db.anismileProduct.groupBy({
			by: ["brand"],
			where: { ...baseWhere, brand: { not: null } },
			_count: { _all: true },
		}),
	]);

	return {
		items,
		total,
		facets: {
			categories: catFacets.map((f) => ({ name: f.category as string, count: f._count._all })),
			franchises: franchiseFacets.map((f) => ({ name: f.franchise as string, count: f._count._all })),
			brands: brandFacets.map((f) => ({ name: f.brand as string, count: f._count._all })),
		},
	};
}

export async function listProductsByCategory({
	slug,
	filters,
	sort = "newest",
	page = 1,
	perPage = 20,
}: {
	slug: string;
	filters?: {
		franchise?: string;
		brand?: string;
		inStock?: boolean;
		urgentDeadline?: boolean;
		showUnavailable?: boolean;
	};
	sort?: string;
	page?: number;
	perPage?: number;
}) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const urgentEnd = new Date(today);
	urgentEnd.setDate(urgentEnd.getDate() + 7);

	// 預設隱藏已過截止日的商品（showUnavailable=false/undefined 時排除）
	const showUnavailable = filters?.showUnavailable ?? false;

	const baseWhere: Prisma.AnismileProductWhereInput = {
		category: { equals: slug, mode: "insensitive" },
		...(filters?.franchise ? { franchise: filters.franchise } : {}),
		...(filters?.brand ? { brand: filters.brand } : {}),
		...(filters?.inStock ? { inStock: true } : {}),
		...(filters?.urgentDeadline ? { orderDeadline: { gte: today, lte: urgentEnd } } : {}),
		...(!showUnavailable ? { OR: [{ orderDeadline: null }, { orderDeadline: { gte: today } }] } : {}),
	};

	const orderBy: Prisma.AnismileProductOrderByWithRelationInput[] =
		sort === "price_asc"
			? [{ sellingPrice: "asc" }]
			: sort === "price_desc"
				? [{ sellingPrice: "desc" }]
				: sort === "deadline"
					? [{ orderDeadline: { sort: "asc", nulls: "last" } }]
					: [{ listingDate: "desc" }, { createdAt: "desc" }];

	const [items, total, franchiseFacets, brandFacets] = await Promise.all([
		db.anismileProduct.findMany({
			where: baseWhere,
			orderBy,
			take: perPage,
			skip: (page - 1) * perPage,
		}),
		db.anismileProduct.count({ where: baseWhere }),
		db.anismileProduct.groupBy({
			by: ["franchise"],
			where: { ...baseWhere, franchise: { not: null } },
			_count: { _all: true },
		}),
		db.anismileProduct.groupBy({
			by: ["brand"],
			where: { ...baseWhere, brand: { not: null } },
			_count: { _all: true },
		}),
	]);

	return {
		items,
		total,
		facets: {
			franchises: franchiseFacets.map((f) => ({ name: f.franchise as string, count: f._count._all })),
			brands: brandFacets.map((f) => ({ name: f.brand as string, count: f._count._all })),
		},
	};
}

export async function listAddresses(userId: string) {
	return db.anismileAddress.findMany({
		where: { userId },
		orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
	});
}

export async function createAddress({
	userId,
	label,
	name,
	phone,
	address,
	idNumber,
	lineId,
}: {
	userId: string;
	label?: string;
	name: string;
	phone: string;
	address: string;
	idNumber?: string;
	lineId?: string;
}) {
	const count = await db.anismileAddress.count({ where: { userId } });
	if (count >= 10) {
		throw new Error("已達地址數量上限（10）");
	}
	return db.anismileAddress.create({
		data: { userId, label, name, phone, address, idNumber, lineId },
	});
}

export async function updateAddress({
	id,
	userId,
	...data
}: {
	id: string;
	userId: string;
	label?: string;
	name?: string;
	phone?: string;
	address?: string;
	idNumber?: string;
	lineId?: string;
}) {
	const addr = await db.anismileAddress.findUnique({ where: { id } });
	if (!addr || addr.userId !== userId) throw new Error("Address not found");
	return db.anismileAddress.update({ where: { id }, data });
}

export async function deleteAddress({ id, userId }: { id: string; userId: string }) {
	const addr = await db.anismileAddress.findUnique({ where: { id } });
	if (!addr || addr.userId !== userId) throw new Error("Address not found");
	return db.anismileAddress.delete({ where: { id } });
}

export async function setDefaultAddress({ id, userId }: { id: string; userId: string }) {
	const addr = await db.anismileAddress.findUnique({ where: { id } });
	if (!addr || addr.userId !== userId) throw new Error("Address not found");
	await db.anismileAddress.updateMany({ where: { userId }, data: { isDefault: false } });
	return db.anismileAddress.update({ where: { id }, data: { isDefault: true } });
}

export async function updateProductFields(input: {
	id: string;
	titleTranslated?: string;
	sellingPrice?: number;
	markupOverride?: number | null;
	discountRate?: number | null;
	saleStatus?: string | null;
}) {
	const updateData: Prisma.AnismileProductUpdateInput = {};

	if (input.titleTranslated !== undefined) {
		updateData.titleTranslated = input.titleTranslated;
	}
	if (input.discountRate !== undefined) {
		updateData.discountRate = input.discountRate !== null ? new Prisma.Decimal(input.discountRate) : null;
	}
	if (input.saleStatus !== undefined) {
		updateData.saleStatus = input.saleStatus;
	}

	if (input.sellingPrice !== undefined) {
		updateData.sellingPrice = new Prisma.Decimal(input.sellingPrice);
		updateData.priceManualOverride = true;
		if (input.markupOverride !== undefined) {
			updateData.markupOverride = input.markupOverride !== null ? new Prisma.Decimal(input.markupOverride) : null;
		}
	} else if (input.markupOverride !== undefined) {
		const product = await db.anismileProduct.findUnique({
			where: { id: input.id },
			select: { costPrice: true },
		});
		if (!product) throw new Error("Product not found");
		const costPrice = product.costPrice;
		const markup = input.markupOverride !== null ? new Prisma.Decimal(input.markupOverride) : await getDefaultMarkup();
		updateData.markupOverride = input.markupOverride !== null ? new Prisma.Decimal(input.markupOverride) : null;
		updateData.sellingPrice = calculateSellingPrice({ costPrice, markup });
		updateData.priceManualOverride = false;
	}

	const updated = await db.anismileProduct.update({
		where: { id: input.id },
		data: updateData,
	});
	return updated;
}
