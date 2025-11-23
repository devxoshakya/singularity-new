export interface ProductConfig {
	productId: string;
	slug: string;
	plan: 'PRO' | 'PREMIUM';
	duration: 'HALF_YEARLY' | 'YEARLY';
	durationMonths: 6 | 12;
}

export const TEST_PRODUCTS: ProductConfig[] = [
	{
		productId: "pdt_JDzNbsYmGOhxlVDyC5OUW",
		slug: 'pro-6m',
		plan: 'PRO',
		duration: 'HALF_YEARLY',
		durationMonths: 6,
	},
	{
		productId: "pdt_uryhVqtxfCswdBlrDnEE3",
		slug: 'pro-12m',
		plan: 'PRO',
		duration: 'YEARLY',
		durationMonths: 12,
	},
	{
		productId: "pdt_CqCeMB2Afh3YzKAGCZC7B",
		slug: 'premium-6m',
		plan: 'PREMIUM',
		duration: 'HALF_YEARLY',
		durationMonths: 6,
	},
	{
		productId: "pdt_ula8jaseTKi8M042GaL2B",
		slug: 'premium-12m',
		plan: 'PREMIUM',
		duration: 'YEARLY',
		durationMonths: 12,
	},
];

export const LIVE_PRODUCTS: ProductConfig[] = [
	{
		productId: "pdt_yJdKleSUGEWp9stkmFvyR",
		slug: 'pro-6m',
		plan: 'PRO',
		duration: 'HALF_YEARLY',
		durationMonths: 6,
	},
	{
		productId: "pdt_QJHRhpyyYt4Gv8J5v9sUo",
		slug: 'pro-12m',
		plan: 'PRO',
		duration: 'YEARLY',
		durationMonths: 12,
	},
	{
		productId: "pdt_ZmY36zosBsaxmC1i1qjWR",
		slug: 'premium-6m',
		plan: 'PREMIUM',
		duration: 'HALF_YEARLY',
		durationMonths: 6,
	},
	{
		productId: "pdt_Rzy5v02GTPaV4uS5vHGu1",
		slug: 'premium-12m',
		plan: 'PREMIUM',
		duration: 'YEARLY',
		durationMonths: 12,
	},
];


export const getProductConfig = (productId: string): ProductConfig | undefined => {
	return [...TEST_PRODUCTS, ...LIVE_PRODUCTS].find(p => p.productId === productId);
};