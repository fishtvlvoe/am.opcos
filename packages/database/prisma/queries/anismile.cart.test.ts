import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted 讓變數在 mock 提升前就可用
const { mockFindUnique, mockUpsert, mockProductFindUnique } = vi.hoisted(() => ({
	mockFindUnique: vi.fn(),
	mockUpsert: vi.fn(),
	mockProductFindUnique: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		anismileProduct: {
			findUnique: mockProductFindUnique,
		},
		anismileCartItem: {
			findUnique: mockFindUnique,
			upsert: mockUpsert,
		},
	},
}));

import { addToCart } from "./anismile";

const mockProduct = {
	id: "prod_1",
	inStock: true,
	orderDeadline: null,
};

beforeEach(() => {
	vi.clearAllMocks();
	// 預設：商品存在且有庫存
	mockProductFindUnique.mockResolvedValue(mockProduct);
	// 預設：upsert 回傳帶 quantity 的物件
	mockUpsert.mockImplementation(
		async ({
			create,
			update,
		}: {
			create?: { quantity: number };
			update?: { quantity: number };
		}) => ({
			id: "item_1",
			userId: "user_1",
			productId: "prod_1",
			quantity: update?.quantity ?? create?.quantity ?? 1,
			product: mockProduct,
		}),
	);
});

describe("addToCart — quantity 上限 999", () => {
	it("quantity:600 呼叫兩次後 DB quantity === 999（封頂）", async () => {
		// 第一次呼叫：購物車為空
		mockFindUnique.mockResolvedValueOnce(null);
		await addToCart({ userId: "user_1", productId: "prod_1", quantity: 600 });

		// 確認第一次 upsert create.quantity = 600
		const firstCall = mockUpsert.mock.calls[0]?.[0];
		expect(firstCall.create.quantity).toBe(600);

		// 第二次呼叫：購物車已有 600
		mockFindUnique.mockResolvedValueOnce({ quantity: 600 });
		await addToCart({ userId: "user_1", productId: "prod_1", quantity: 600 });

		// 600 + 600 = 1200，應封頂為 999
		const secondCall = mockUpsert.mock.calls[1]?.[0];
		expect(secondCall.update.quantity).toBe(999);
	});

	it("首次加入時 quantity 超過 999 直接封頂", async () => {
		mockFindUnique.mockResolvedValueOnce(null);
		await addToCart({ userId: "user_1", productId: "prod_1", quantity: 1200 });

		const call = mockUpsert.mock.calls[0]?.[0];
		expect(call.create.quantity).toBe(999);
	});

	it("現有 998 + 加入 1 = 999（不超限）", async () => {
		mockFindUnique.mockResolvedValueOnce({ quantity: 998 });
		await addToCart({ userId: "user_1", productId: "prod_1", quantity: 1 });

		const call = mockUpsert.mock.calls[0]?.[0];
		expect(call.update.quantity).toBe(999);
	});

	it("現有 500 + 加入 100 = 600（正常累加）", async () => {
		mockFindUnique.mockResolvedValueOnce({ quantity: 500 });
		await addToCart({ userId: "user_1", productId: "prod_1", quantity: 100 });

		const call = mockUpsert.mock.calls[0]?.[0];
		expect(call.update.quantity).toBe(600);
	});

	it("商品無庫存時拋出錯誤", async () => {
		mockProductFindUnique.mockResolvedValueOnce({ ...mockProduct, inStock: false });

		await expect(
			addToCart({ userId: "user_1", productId: "prod_1", quantity: 1 }),
		).rejects.toThrow("Product unavailable");
	});
});
