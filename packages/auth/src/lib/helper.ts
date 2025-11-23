import { LIVE_PRODUCTS, TEST_PRODUCTS } from "../config/products";


export const getEndingDate = (durationMonths : number, fromDate: Date): Date => {
    const endDate = new Date(fromDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
}

export const getDurationMonthsFromProductId = (productId: string): number | null => {
    const allProducts = [...TEST_PRODUCTS, ...LIVE_PRODUCTS];
    const product = allProducts.find(p => p.productId === productId);
    return product ? product.durationMonths : null;
}
