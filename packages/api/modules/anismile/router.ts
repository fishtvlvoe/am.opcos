import {
	createAddressProcedure,
	deleteAddressProcedure,
	listAddressesProcedure,
	setDefaultAddressProcedure,
	updateAddressProcedure,
} from "./procedures/addresses";
import {
	addCartItem,
	createCheckoutStripeSession,
	checkoutCart,
	deleteCartItem,
	getCartItems,
	removeCartItemProcedure,
	updateCartItemQuantityProcedure,
} from "./procedures/cart";
import { listCategories } from "./procedures/categories";
import {
	createOrder,
	exportOrdersCsv,
	forwardOrderToSupplierProcedure,
	getDashboardStats,
	getOrderDetail,
	listCustomers,
	listOrderRows,
	patchOrderStatus,
} from "./procedures/orders";
import { listChildOrdersProcedure, splitOrderProcedure } from "./procedures/order-split";
import {
	batchPatchProducts,
	getProductById,
	listByCategory,
	listLatestProducts,
	listProducts,
	listProductsAdmin,
	patchProduct,
	patchProductMarkup,
	searchProducts,
} from "./procedures/products";
import { getBanners, getDeadlineProducts, getListingDates, getProductsByDate, getSeriesList } from "./procedures/homepage";
import { confirmImportOrder, matchProducts } from "./procedures/import-order";
import { adminUpdateTier, getMyTier } from "./procedures/member-tier";
import { getNotificationSettings, patchNotificationSettings, testLineNotification } from "./procedures/notifications";
import { adminBatchUpdateItemStatus, listProductPool } from "./procedures/product-pool";
import { listUsersForRoles, patchUserRole } from "./procedures/roles";
import { getDefaultMarkupSetting, getTierSettings, patchDefaultMarkup, patchTierSettings } from "./procedures/settings";
import { listSeries } from "./procedures/series";
import { getSyncLogs, triggerSync } from "./procedures/sync";
import { addWishlist, batchAddToCart, listWishlist, removeWishlist, updateWishlistQuantity } from "./procedures/wishlist";

export const anismileRouter = {
	sync: triggerSync,
	syncLogs: getSyncLogs,
	products: {
		list: listProducts,
		listAdmin: listProductsAdmin,
		latest: listLatestProducts,
		getById: getProductById,
		patchMarkup: patchProductMarkup,
		patchProduct,
		batchPatch: batchPatchProducts,
		search: searchProducts,
		listByCategory,
	},
	addresses: {
		list: listAddressesProcedure,
		create: createAddressProcedure,
		update: updateAddressProcedure,
		delete: deleteAddressProcedure,
		setDefault: setDefaultAddressProcedure,
	},
	categories: listCategories,
	series: listSeries,
	settings: {
		getDefaultMarkup: getDefaultMarkupSetting,
		patchDefaultMarkup,
		getTierSettings,
		patchTierSettings,
	},
	notifications: {
		getSettings: getNotificationSettings,
		patchSettings: patchNotificationSettings,
		testLine: testLineNotification,
	},
	cart: {
		add: addCartItem,
		list: getCartItems,
		delete: deleteCartItem,
		addItem: addCartItem,
		getItems: getCartItems,
		updateQuantity: updateCartItemQuantityProcedure,
		removeItem: removeCartItemProcedure,
		checkout: checkoutCart,
		checkoutStripeSession: createCheckoutStripeSession,
	},
	orders: {
		create: createOrder,
		list: listOrderRows,
		getById: getOrderDetail,
		split: splitOrderProcedure,
		children: listChildOrdersProcedure,
		patch: patchOrderStatus,
		export: exportOrdersCsv,
		forwardSupplier: forwardOrderToSupplierProcedure,
	},
	admin: {
		dashboard: getDashboardStats,
		customers: listCustomers,
	},
	users: {
		patchRole: patchUserRole,
		listRoles: listUsersForRoles,
	},
	wishlist: {
		add: addWishlist,
		remove: removeWishlist,
		list: listWishlist,
		updateQuantity: updateWishlistQuantity,
		batchAddToCart: batchAddToCart,
	},
	memberTier: {
		getMyTier: getMyTier,
		adminUpdateTier: adminUpdateTier,
	},
	importOrder: {
		matchProducts: matchProducts,
		confirmImportOrder: confirmImportOrder,
	},
	productPool: {
		list: listProductPool,
		adminBatchUpdateItemStatus: adminBatchUpdateItemStatus,
	},
	homepage: {
		getBanners: getBanners,
		getDeadlineProducts: getDeadlineProducts,
		getListingDates: getListingDates,
		getProductsByDate: getProductsByDate,
		getSeriesList: getSeriesList,
	},
};
