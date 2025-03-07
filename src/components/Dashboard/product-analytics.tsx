import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Legend, Line, CartesianGrid } from 'recharts';
import { Invoice, Product, Supplier } from './dashboard-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '../ui/button';
import { AddProductDialog } from './AddProductDialog';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface ProductAnalysis {
    productId: string;
    name: string;
    totalUnitsSold: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    profitMargin: number;
    averageSellingPrice: number;
    isEstimated?: boolean;
}

interface InvoiceProductDetail {
    name: string;
    quantity: number;
    price: number;
    cost: number;
    profit: number;
    profitMargin: number;
    isEstimated: boolean;
}

interface InvoiceAnalysis {
    invoiceId: string;
    date: string;
    customer: string;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    profitMargin: number;
    totalItems: number;
    productCount: number;
    // Add array of product details for the detailed view
    products: InvoiceProductDetail[];
}

interface ProductAnalyticsProps {
    data: Invoice[];
    products: Product[];
    suppliers: Supplier[];
    onProductAdded: () => void; // Add this prop
}

interface SupplierDailyData {
    date: string;
    revenue: number;
    profit: number;
    unitsSold: number;
    margin: number;
    productsSold: number;
}

// Add these interfaces near your other interfaces
interface SupplierTimelineData {
    date: string;
    revenue: number;
    profit: number;
    unitsSold: number;
}

interface SupplierProduct {
    name: string;
    unitsSold: number;
    revenue: number;
    profit: number;
    margin: number;
    growth: number;
    averageOrderSize: number;
}

interface DetailedSupplierAnalysis {
    supplier: {
        id: string;
        name: string;
        code: number;
    };
    overview: {
        totalRevenue: number;
        totalProfit: number;
        totalUnitsSold: number;
        averageMargin: number;
        productCount: number;
    };
    products: {
        name: string;
        unitsSold: number;
        revenue: number;
        profit: number;
        margin: number;
        trend: 'up' | 'down' | 'stable';
    }[];
    timeline: SupplierTimelineData[];
}

// Add these new interfaces at the top
interface SupplierTrendAnalysis {
    revenueGrowth: number;
    profitGrowth: number;
    topGrowingProduct: string;
    productGrowthRate: number;
    averageOrderValue: number;
    productDiversityScore: number;
}

type InvoiceSortKey = keyof Pick<InvoiceAnalysis, 'date' | 'customer' | 'totalRevenue' | 'profit' | 'profitMargin' | 'totalItems'>;



const SimpleTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="group relative inline-block z-50">
        {children}
        <div className="absolute hidden group-hover:block bg-background z-50 p-2 rounded shadow-lg border w-[200px] text-sm -right-2 top-6">
            {text}
        </div>
    </div>
);


export function ProductAnalytics({ data, products, suppliers, onProductAdded }: ProductAnalyticsProps) {

    const [productToAdd, setProductToAdd] = useState<{ name: string; cost: number } | null>(null);

    // Add these new state declarations in ProductAnalytics
    const [trendsSortCriteria, setTrendsSortCriteria] = useState('revenueGrowth');
    const [trendsSortOrder, setTrendsSortOrder] = useState('desc');
    const [productsSortCriteria, setProductsSortCriteria] = useState('revenue');
    const [productsSortOrder, setProductsSortOrder] = useState('desc');


    const [selectedSupplier, setSelectedSupplier] = useState<DetailedSupplierAnalysis | null>(null);

    const [timelineMetric, setTimelineMetric] = useState<'revenue' | 'profit' | 'unitsSold' | 'margin' | 'productsSold'>('revenue');

    const closeInvoiceDetail = () => setSelectedInvoice(null);
    const handleInvoiceClick = (invoice: InvoiceAnalysis) => {
        setSelectedInvoice(invoice);
    };
    const [selectedTimelineSuppliers, setSelectedTimelineSuppliers] = useState<string[]>([]);

    const handleSupplierClick = (supplierId: number) => {
        // Get supplier details
        const supplier = suppliers.find(s => s.id === supplierId.toString());
        if (!supplier) return;

        // Add near your other state declarations in ProductAnalytics

        // Get all products for this supplier
        const supplierProducts = products.filter(p => p.supplier === supplierId.toString());

        // Calculate timeline data
        const timeline = data.reduce((acc: SupplierTimelineData[], invoice) => {
            try {
                const invoiceProducts = JSON.parse(invoice.products);
                let dailyRevenue = 0;
                let dailyProfit = 0;
                let dailyUnits = 0;

                invoiceProducts.forEach((product: any) => {
                    const productData = supplierProducts.find(p =>
                        p.name.toLowerCase().trim() === product.name.toLowerCase().trim()
                    );
                    if (productData) {
                        dailyRevenue += product.price * product.quantity;
                        dailyProfit += (product.price - productData.cost) * product.quantity;
                        dailyUnits += product.quantity;
                    }
                });

                if (dailyRevenue > 0) {
                    const existingDate = acc.find(d => d.date === invoice.date);
                    if (existingDate) {
                        existingDate.revenue += dailyRevenue;
                        existingDate.profit += dailyProfit;
                        existingDate.unitsSold += dailyUnits;
                    } else {
                        acc.push({
                            date: invoice.date,
                            revenue: dailyRevenue,
                            profit: dailyProfit,
                            unitsSold: dailyUnits
                        });
                    }
                }
            } catch (error) {
                console.error(`Error parsing invoice products:`, error);
            }
            return acc;
        }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setSelectedSupplier({
            supplier,
            overview: {
                totalRevenue: timeline.reduce((sum, day) => sum + day.revenue, 0),
                totalProfit: timeline.reduce((sum, day) => sum + day.profit, 0),
                totalUnitsSold: timeline.reduce((sum, day) => sum + day.unitsSold, 0),
                averageMargin: (timeline.reduce((sum, day) => sum + day.profit, 0) /
                    timeline.reduce((sum, day) => sum + day.revenue, 0)) * 100,
                productCount: supplierProducts.length
            },
            products: supplierProducts.map(product => {
                const productAnalysisItem = productAnalysis.find(p => p.productId === product.id);
                return {
                    name: product.name,
                    unitsSold: productAnalysisItem?.totalUnitsSold || 0,
                    revenue: productAnalysisItem?.totalRevenue || 0,
                    profit: productAnalysisItem?.profit || 0,
                    margin: productAnalysisItem?.profitMargin || 0,
                    growth: 0, // Add default value
                    averageOrderSize: 0, // Add default value
                    trend: 'stable'
                };
            }),
            timeline
        });
    };

    const { productAnalysis, unmatchedProducts, averageProfitMargin, supplierAnalysis, invoiceAnalysis } = useMemo(() => {

        const analysis = new Map<string, ProductAnalysis>();
        const unmatched = new Map<string, ProductAnalysis>();
        const supplierAnalysis = new Map<string, any>();
        const invoiceAnalysisMap = new Map<string, InvoiceAnalysis>();
        let totalMargin = 0;
        let marginCount = 0;

        // Initialize analysis with all products
        products.forEach(product => {
            analysis.set(product.name.toLowerCase(), {
                productId: product.id,
                name: product.name,
                totalUnitsSold: 0,
                totalRevenue: 0,
                totalCost: 0,
                profit: 0,
                profitMargin: 0,
                averageSellingPrice: 0,
            });

            // Initialize supplier analysis
            if (!supplierAnalysis.has(product.supplier)) {
                supplierAnalysis.set(product.supplier, {
                    supplierId: product.supplier,
                    totalUnitsSold: 0,
                    totalRevenue: 0,
                    totalCost: 0,
                    profit: 0,
                    profitMargin: 0,
                });
            }
        });

        // First pass: analyze matched products to calculate average profit margin
        data.forEach(invoice => {
            try {
                const invoiceProducts = JSON.parse(invoice.products);
                invoiceProducts.forEach((product: any) => {
                    const productData = products.find(p =>
                        p.name.toLowerCase() === product.name.toLowerCase()
                    );
                    if (productData) {
                        const current = analysis.get(product.name.toLowerCase());
                        if (current) {
                            current.totalUnitsSold += product.quantity;
                            current.totalRevenue += product.price * product.quantity;
                            current.totalCost += productData.cost * product.quantity;
                            current.profit = current.totalRevenue - current.totalCost;
                            current.profitMargin = (current.profit / current.totalRevenue) * 100;
                            current.averageSellingPrice = current.totalRevenue / current.totalUnitsSold;

                            if (current.profitMargin > 0) {
                                totalMargin += current.profitMargin;
                                marginCount++;
                            }

                            // Update supplier analysis
                            const supplier = supplierAnalysis.get(productData.supplier);
                            supplier.totalUnitsSold += product.quantity;
                            supplier.totalRevenue += product.price * product.quantity;
                            supplier.totalCost += productData.cost * product.quantity;
                            supplier.profit = supplier.totalRevenue - supplier.totalCost;
                            supplier.profitMargin = (supplier.profit / supplier.totalRevenue) * 100;
                        }
                    }
                });
            } catch (error) {
                console.error(`Error parsing products for invoice ${invoice.id}:`, error);
            }
        });

        const avgMargin = marginCount > 0 ? totalMargin / marginCount : 20; // Default 20% if no data

        // Second pass: handle unmatched products
        data.forEach(invoice => {
            try {
                const invoiceProducts = JSON.parse(invoice.products);
                invoiceProducts.forEach((product: any) => {
                    const productData = products.find(p =>
                        p.name.toLowerCase() === product.name.toLowerCase()
                    );
                    if (!productData) {
                        const key = product.name.toLowerCase();
                        const current = unmatched.get(key) || {
                            productId: `unmatched-${key}`,
                            name: product.name,
                            totalUnitsSold: 0,
                            totalRevenue: 0,
                            totalCost: 0,
                            profit: 0,
                            profitMargin: avgMargin,
                            averageSellingPrice: 0,
                            isEstimated: true,
                        };

                        current.totalUnitsSold += product.quantity;
                        current.totalRevenue += product.price * product.quantity;
                        current.averageSellingPrice = current.totalRevenue / current.totalUnitsSold;
                        // Estimate cost based on average margin
                        current.totalCost = current.totalRevenue * (1 - (avgMargin / 100));
                        current.profit = current.totalRevenue - current.totalCost;

                        unmatched.set(key, current);
                    }
                });
            } catch (error) {
                console.error(`Error parsing products for invoice ${invoice.id}:`, error);
            }
        });



        const matchedProducts = Array.from(analysis.values())
            .filter(product => product.totalUnitsSold > 0);
        const unmatchedProductsArray = Array.from(unmatched.values());

        // Calculate invoice analysis with product details
        data.forEach(invoice => {
            try {
                const invoiceProducts = JSON.parse(invoice.products);
                let invoiceRevenue = 0;
                let invoiceCost = 0;
                let totalItems = 0;
                let productCount = 0;
                const productDetails: InvoiceProductDetail[] = [];

                invoiceProducts.forEach((product: any) => {
                    const productData = products.find(p =>
                        p.name.toLowerCase() === product.name.toLowerCase()
                    );

                    totalItems += product.quantity;
                    productCount++;
                    const productRevenue = product.price * product.quantity;
                    invoiceRevenue += productRevenue;

                    let productCost = 0;
                    const isEstimated = !productData;

                    if (productData) {
                        productCost = productData.cost * product.quantity;
                    } else {
                        // Estimate cost using average margin
                        productCost = productRevenue * (1 - (avgMargin / 100));
                    }

                    invoiceCost += productCost;
                    const productProfit = productRevenue - productCost;
                    const productProfitMargin = (productProfit / productRevenue) * 100;

                    productDetails.push({
                        name: product.name,
                        quantity: product.quantity,
                        price: product.price,
                        cost: productCost / product.quantity, // Per unit cost
                        profit: productProfit,
                        profitMargin: productProfitMargin,
                        isEstimated
                    });
                });

                const profit = invoiceRevenue - invoiceCost;
                const profitMargin = (profit / invoiceRevenue) * 100;

                invoiceAnalysisMap.set(invoice.id.toString(), {
                    invoiceId: invoice.id.toString(),
                    date: invoice.date,
                    customer: invoice.customerName,
                    totalRevenue: invoiceRevenue,
                    totalCost: invoiceCost,
                    profit: profit,
                    profitMargin: profitMargin,
                    totalItems: totalItems,
                    productCount: productCount,
                    products: productDetails
                });
            } catch (error) {
                console.error(`Error analyzing invoice ${invoice.id}:`, error);
            }
        });

        // Return existing values plus invoice analysis
        return {
            productAnalysis: [...matchedProducts, ...unmatchedProductsArray].sort((a, b) => b.profit - a.profit),
            unmatchedProducts: unmatchedProductsArray,
            averageProfitMargin: avgMargin,
            supplierAnalysis: Array.from(supplierAnalysis.values()),
            invoiceAnalysis: Array.from(invoiceAnalysisMap.values())
        };
    }, [data, products]);

    const [sortCriteria, setSortCriteria] = useState('profit'); // Default sort by profit
    const [sortOrder, setSortOrder] = useState('desc'); // Default descending order
    const [filterName, setFilterName] = useState(''); // Filter by product name

    const sortedAndFilteredProducts = useMemo(() => {
        let filtered = productAnalysis.filter(product =>
            product.name.toLowerCase().includes(filterName.toLowerCase())
        );

        return filtered.sort((a: any, b: any) => {
            if (sortCriteria === 'name') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else {
                return sortOrder === 'asc'
                    ? a[sortCriteria] - b[sortCriteria]
                    : b[sortCriteria] - a[sortCriteria];
            }
        });
    }, [productAnalysis, sortCriteria, sortOrder, filterName]);

    const [supplierSortCriteria, setSupplierSortCriteria] = useState('profit'); // Default sort by profit
    const [supplierSortOrder, setSupplierSortOrder] = useState('desc'); // Default descending order
    const [supplierFilterName, setSupplierFilterName] = useState(''); // Filter by supplier name

    const sortedAndFilteredSuppliers = useMemo(() => {
        let filtered = supplierAnalysis.filter(supplier =>
            suppliers.find(s => s.id === supplier.supplierId)?.name.toLowerCase().includes(supplierFilterName.toLowerCase())
        );

        return filtered.sort((a: any, b: any) => {
            if (supplierSortCriteria === 'name') {
                const aName = suppliers.find(s => s.id === a.supplierId)?.name || '';
                const bName = suppliers.find(s => s.id === b.supplierId)?.name || '';
                return supplierSortOrder === 'asc'
                    ? aName.localeCompare(bName)
                    : bName.localeCompare(aName);
            } else {
                return supplierSortOrder === 'asc'
                    ? a[supplierSortCriteria] - b[supplierSortCriteria]
                    : b[supplierSortCriteria] - a[supplierSortCriteria];
            }
        });
    }, [supplierAnalysis, supplierSortCriteria, supplierSortOrder, supplierFilterName]);






    const totalProfit = productAnalysis.reduce((sum, product) => sum + product.profit, 0);
    const topPerformers = productAnalysis.slice(0, 5);






    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceAnalysis | null>(null);
    const [groupByCustomer, setGroupByCustomer] = useState(false);
    const [invoiceSortCriteria, setInvoiceSortCriteria] = useState<InvoiceSortKey>('date');
    const [invoiceSortOrder, setInvoiceSortOrder] = useState<'asc' | 'desc'>('desc');
    const [invoiceFilterText, setInvoiceFilterText] = useState('');

    // Add this for filtered and sorted invoices
    const sortedAndFilteredInvoices = useMemo(() => {
        let filtered = invoiceAnalysis.filter(invoice =>
            invoice.customer.toLowerCase().includes(invoiceFilterText.toLowerCase()) ||
            invoice.invoiceId.toLowerCase().includes(invoiceFilterText.toLowerCase())
        );

        // Apply sorting (with proper typing)
        const sorted = filtered.sort((a, b) => {
            if (invoiceSortCriteria === 'date' || invoiceSortCriteria === 'customer') {
                return invoiceSortOrder === 'asc'
                    ? a[invoiceSortCriteria].localeCompare(b[invoiceSortCriteria])
                    : b[invoiceSortCriteria].localeCompare(a[invoiceSortCriteria]);
            } else {
                return invoiceSortOrder === 'asc'
                    ? a[invoiceSortCriteria] - b[invoiceSortCriteria]
                    : b[invoiceSortCriteria] - a[invoiceSortCriteria];
            }
        });

        // If grouping by customer is enabled, transform the data
        if (groupByCustomer) {
            const customerGroups: { [key: string]: InvoiceAnalysis[] } = {};

            // Group invoices by customer
            sorted.forEach(invoice => {
                if (!customerGroups[invoice.customer]) {
                    customerGroups[invoice.customer] = [];
                }
                customerGroups[invoice.customer].push(invoice);
            });

            // Flatten the grouped array with customer headers
            const result: Array<InvoiceAnalysis | { isCustomerHeader: true, customer: string, count: number }> = [];

            Object.entries(customerGroups).forEach(([customer, invoices]) => {
                // Add a special header object
                result.push({
                    isCustomerHeader: true,
                    customer,
                    count: invoices.length
                } as any); // Using 'any' for the header object which differs from InvoiceAnalysis

                // Add each invoice in the group
                invoices.forEach(invoice => result.push(invoice));
            });

            return result;
        }

        return sorted;
    }, [invoiceAnalysis, invoiceSortCriteria, invoiceSortOrder, invoiceFilterText, groupByCustomer]);





    // Enhanced supplier analysis with additional metrics
    const enhancedSupplierAnalysis = useMemo(() => {
        return sortedAndFilteredSuppliers.map(supplier => {
            const supplierName = suppliers.find(s => s.id === supplier.supplierId)?.name || '';
            const supplierProducts = products.filter(p => p.supplier === supplier.supplierId);
            const productVariety = supplierProducts.length;

            // Track monthly performance for trend analysis
            const monthlyPerformance = new Map<string, {
                revenue: number;
                profit: number;
                productsSold: Set<string>;
                totalOrders: number;
                totalValue: number;
            }
            >();

            // Process invoices for trend analysis
            data.forEach(invoice => {
                const monthKey = new Date(invoice.date).toISOString().slice(0, 7);
                try {
                    const invoiceProducts = JSON.parse(invoice.products);
                    let monthRevenue = 0;
                    let monthProfit = 0;
                    const productsSold = new Set<string>();

                    invoiceProducts.forEach((product: any) => {
                        const productData = supplierProducts.find(p =>
                            p.name.toLowerCase().trim() === product.name.toLowerCase().trim()
                        );
                        if (productData) {
                            monthRevenue += product.price * product.quantity;
                            monthProfit += (product.price - productData.cost) * product.quantity;
                            productsSold.add(product.name);
                        }
                    });

                    if (!monthlyPerformance.has(monthKey)) {
                        monthlyPerformance.set(monthKey, {
                            revenue: 0,
                            profit: 0,
                            productsSold: new Set(),
                            totalOrders: 0,
                            totalValue: 0
                        });
                    }

                    const monthData = monthlyPerformance.get(monthKey)!;
                    monthData.revenue += monthRevenue;
                    monthData.profit += monthProfit;
                    monthData.totalOrders += 1;
                    monthData.totalValue += monthRevenue;
                    productsSold.forEach(p => monthData.productsSold.add(p));
                } catch (error) {
                    console.error(`Error processing invoice for trend analysis:`, error);
                }
            });

            // Calculate trends
            const monthsArray = Array.from(monthlyPerformance.entries())
                .sort((a, b) => a[0].localeCompare(b[0]));

            const trendAnalysis: SupplierTrendAnalysis = {
                revenueGrowth: 0,
                profitGrowth: 0,
                topGrowingProduct: '',
                productGrowthRate: 0,
                averageOrderValue: 0,
                productDiversityScore: 0
            };

            if (monthsArray.length >= 2) {
                // Get last 2 months with actual sales
                const lastMonthsWithSales = monthsArray
                    .filter(([_, data]) => data.revenue > 0)
                    .slice(-2);

                if (lastMonthsWithSales.length === 2) {
                    const [previousMonth, lastMonth] = lastMonthsWithSales;

                    trendAnalysis.revenueGrowth = ((lastMonth[1].revenue - previousMonth[1].revenue) / Math.abs(previousMonth[1].revenue)) * 100;
                    trendAnalysis.profitGrowth = ((lastMonth[1].profit - previousMonth[1].profit) / Math.abs(previousMonth[1].profit)) * 100;
                    trendAnalysis.averageOrderValue = lastMonth[1].totalOrders > 0
                        ? lastMonth[1].totalValue / lastMonth[1].totalOrders
                        : 0;
                    trendAnalysis.productDiversityScore = productVariety > 0
                        ? (lastMonth[1].productsSold.size / productVariety) * 100
                        : 0;
                }
            }

            // Find top and lowest margin products with additional metrics
            const productPerformance = supplierProducts.map(product => {
                const productAnalysisItem = productAnalysis.find(p => p.productId === product.id);
                const monthlyData = new Map<string, { revenue: number; units: number }>();

                // Calculate product growth
                data.forEach(invoice => {
                    const monthKey = new Date(invoice.date).toISOString().slice(0, 7);
                    try {
                        const invoiceProducts = JSON.parse(invoice.products);
                        const productSale = invoiceProducts.find((p: any) =>
                            p.name.toLowerCase().trim() === product.name.toLowerCase().trim()
                        );

                        if (productSale) {
                            if (!monthlyData.has(monthKey)) {
                                monthlyData.set(monthKey, { revenue: 0, units: 0 });
                            }
                            const data = monthlyData.get(monthKey)!;
                            data.revenue += productSale.price * productSale.quantity;
                            data.units += productSale.quantity;
                        }
                    } catch (error) {
                        console.error(`Error processing product sales:`, error);
                    }
                });

                const monthlyTrend = Array.from(monthlyData.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]));

                let growth = 0;
                if (monthlyTrend.length >= 2) {
                    const lastMonth = monthlyTrend[monthlyTrend.length - 1][1];
                    const previousMonth = monthlyTrend[monthlyTrend.length - 2][1];
                    growth = ((lastMonth.units - previousMonth.units) / previousMonth.units) * 100;
                }

                return {
                    name: product.name,
                    unitsSold: productAnalysisItem?.totalUnitsSold || 0,
                    revenue: productAnalysisItem?.totalRevenue || 0,
                    profit: productAnalysisItem?.profit || 0,
                    margin: productAnalysisItem?.profitMargin || 0,
                    growth,
                    averageOrderSize: monthlyTrend.length > 0
                        ? monthlyTrend.reduce((sum, [_, data]) => sum + data.units, 0) / monthlyTrend.length
                        : 0
                };
            });

            const sortedByMargin = productPerformance
                .filter(product => product.revenue > 0) // Only consider products with sales
                .sort((a, b) => a.margin - b.margin);

            const lowestMarginProduct = sortedByMargin[0];
            const topProduct = productPerformance
                .sort((a, b) => b.revenue - a.revenue)[0]; // Sort by revenue to find top product

            // Find top growing product
            const topGrowingProduct = productPerformance.reduce((prev, current) =>
                current.growth > prev.growth ? current : prev
            );
            trendAnalysis.topGrowingProduct = topGrowingProduct.name;
            trendAnalysis.productGrowthRate = topGrowingProduct.growth;

            return {
                ...supplier,
                name: supplierName,
                productCount: productVariety,
                trends: trendAnalysis,
                products: productPerformance,
                topProduct: topProduct?.name || 'N/A',
                lowestMarginProduct: lowestMarginProduct?.name || 'N/A',
                lowestMargin: lowestMarginProduct?.margin || 0,
                performance: {
                    averageMargin: supplier.profitMargin,
                    revenuePerProduct: supplier.totalRevenue / productVariety,
                    profitPerProduct: supplier.profit / productVariety,
                    averageProductContribution: (supplier.profit / totalProfit) * 100
                }
            };
        });
    }, [sortedAndFilteredSuppliers, suppliers, products, productAnalysis, data, totalProfit]);


    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalProfit.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageProfitMargin.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products Analyzed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productAnalysis.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {unmatchedProducts.length} unmatched products
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productAnalysis[0]?.profitMargin.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">{productAnalysis[0]?.name}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Top 5 Products by Profit</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topPerformers}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="profit" fill="#0ea5e9" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="productProfit" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="productProfit">Product Profit Analysis</TabsTrigger>
                    <TabsTrigger value="supplierProfit">Supplier Profit Analysis</TabsTrigger>
                    <TabsTrigger value="invoiceAnalysis">Invoice Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="productProfit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Performance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <select
                                    value={sortCriteria}
                                    onChange={(e) => setSortCriteria(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground"
                                >
                                    <option value="profit">Profit</option>
                                    <option value="name">Name</option>
                                    <option value="totalUnitsSold">Units Sold</option>
                                    <option value="totalRevenue">Revenue</option>
                                    <option value="profitMargin">Margin</option>
                                </select>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground"
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Filter by name..."
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground"
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-right">Units Sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                        <TableHead className="text-right">Margin
                                            <SimpleTooltip text="Profit as a percentage of revenue, indicates pricing efficiency">
                                                <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                            </SimpleTooltip>
                                        </TableHead>
                                        <TableHead className="text-right">Avg Price</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredProducts.map((product) => (
                                        <TableRow key={product.productId}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-right">{product.totalUnitsSold}</TableCell>
                                            <TableCell className="text-right">₹{product.totalRevenue.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₹{product.totalCost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₹{product.profit.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{product.profitMargin.toFixed(1)}%</TableCell>
                                            <TableCell className="text-right">₹{product.averageSellingPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                {product.isEstimated ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-yellow-500">Estimated</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setProductToAdd({
                                                                name: product.name,
                                                                cost: product.totalCost / product.totalUnitsSold
                                                            })}
                                                        >
                                                            Add to Database
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-green-500">Matched</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="supplierProfit" className="space-y-4">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Enhanced Supplier Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <select
                                    value={supplierSortCriteria}
                                    onChange={(e) => setSupplierSortCriteria(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground"
                                >
                                    <option value="profit">Profit</option>
                                    <option value="name">Name</option>
                                    <option value="totalUnitsSold">Units Sold</option>
                                    <option value="totalRevenue">Revenue</option>
                                    <option value="profitMargin">Margin</option>
                                    <option value="productCount">Product Variety</option>
                                </select>
                                <select
                                    value={supplierSortOrder}
                                    onChange={(e) => setSupplierSortOrder(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground"
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Filter by supplier name..."
                                    value={supplierFilterName}
                                    onChange={(e) => setSupplierFilterName(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground"
                                />
                            </div>

                            <Tabs defaultValue="overview" className="mt-4">
                                <TabsList>
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="trends">Trends</TabsTrigger>
                                    <TabsTrigger value="products">Products</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview">
                                    <Table>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Supplier
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Products
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Units Sold
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Revenue
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Profit
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Margin
                                                    </TableHead>
                                                    <TableHead>
                                                        Top Product
                                                    </TableHead>
                                                    <TableHead>
                                                        Lowest Margin Product
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {enhancedSupplierAnalysis.map((supplier) => (
                                                    <TableRow
                                                        key={supplier.supplierId}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => handleSupplierClick(supplier.supplierId)}
                                                    >
                                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                                        <TableCell className="text-right">{supplier.productCount}</TableCell>
                                                        <TableCell className="text-right">{supplier.totalUnitsSold}</TableCell>
                                                        <TableCell className="text-right">₹{supplier.totalRevenue.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">₹{supplier.profit.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">{supplier.profitMargin.toFixed(1)}%</TableCell>
                                                        <TableCell>{supplier.topProduct}</TableCell>
                                                        <TableCell>
                                                            {supplier.lowestMarginProduct !== 'N/A' ? (
                                                                <>
                                                                    {supplier.lowestMarginProduct}
                                                                    <span className={`text-xs ml-1 ${supplier.lowestMargin < 20 ? 'text-red-500' : 'text-muted-foreground'
                                                                        }`}>
                                                                        ({supplier.lowestMargin.toFixed(1)}%)
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-muted-foreground">No data</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Table>
                                </TabsContent>
                                <TabsContent value="trends">
                                    <Card className="mb-4">
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold">Understanding Supplier Trends</h3>
                                                <div className="text-sm text-muted-foreground space-y-2">
                                                    <p><span className="font-medium">Revenue Growth:</span> Shows month-over-month change in revenue. Positive values indicate growing sales.</p>
                                                    <p><span className="font-medium">Profit Growth:</span> Indicates profitability trends. Lower than revenue growth might suggest increasing costs.</p>
                                                    <p><span className="font-medium">Top Growing Product:</span> Best performing product by sales growth. Good candidate for inventory focus.</p>
                                                    <p><span className="font-medium">Product Growth Rate:</span> Growth rate of the top product. "New" indicates recently added products.</p>
                                                    <p><span className="font-medium">Avg Order Value:</span> Higher values suggest premium products or successful upselling.</p>
                                                    <p><span className="font-medium">Product Diversity:</span> Percentage of supplier's catalog actively selling. Low values might need attention.</p>
                                                </div>
                                                <div className="text-sm mt-2">
                                                    <span className="font-medium">Note:</span> Only suppliers with active sales in the last two months are shown. Use sorting options to identify best and worst performers.
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div className="flex gap-4 mb-4">
                                        <select
                                            value={trendsSortCriteria}
                                            onChange={(e) => setTrendsSortCriteria(e.target.value)}
                                            className="p-2 border rounded bg-primary-foreground"
                                        >
                                            <option value="revenueGrowth">Revenue Growth</option>
                                            <option value="profitGrowth">Profit Growth</option>
                                            <option value="productGrowthRate">Product Growth Rate</option>
                                            <option value="averageOrderValue">Average Order Value</option>
                                            <option value="productDiversityScore">Product Diversity</option>
                                        </select>
                                        <select
                                            value={trendsSortOrder}
                                            onChange={(e) => setTrendsSortOrder(e.target.value)}
                                            className="p-2 border rounded bg-primary-foreground"
                                        >
                                            <option value="desc">Highest First</option>
                                            <option value="asc">Lowest First</option>
                                        </select>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Supplier</TableHead>
                                                <TableHead className="text-right"> Revenue Growth
                                                    <SimpleTooltip text="Percentage change in revenue compared to previous month. Positive values indicate growth, negative values indicate decline.">
                                                        <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                                    </SimpleTooltip>
                                                </TableHead>
                                                <TableHead className="text-right">Profit Growth
                                                    <SimpleTooltip text="Percentage change in profit compared to previous month. Shows how effectively the supplier is maintaining or improving profitability.">
                                                        <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                                    </SimpleTooltip>
                                                </TableHead>
                                                <TableHead>Top Growing Product
                                                    <SimpleTooltip text="Product with highest sales growth in recent months">
                                                        <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                                    </SimpleTooltip>
                                                </TableHead>
                                                <TableHead className="text-right">Product Growth Rate
                                                    <SimpleTooltip text="Month-over-month percentage change in sales volume">
                                                        <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                                    </SimpleTooltip>
                                                </TableHead>
                                                <TableHead className="text-right">Avg Order Value
                                                    <SimpleTooltip text="Average revenue per transaction for this supplier's products">
                                                        <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                                    </SimpleTooltip>
                                                </TableHead>
                                                <TableHead className="text-right">Product Diversity
                                                    <SimpleTooltip text="Percentage of supplier's total products actively selling">
                                                        <InfoCircledIcon className="inline h-4 w-4 ml-1 text-muted-foreground" />
                                                    </SimpleTooltip>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enhancedSupplierAnalysis
                                                .filter(supplier =>
                                                    supplier.totalRevenue > 0 &&
                                                    supplier.trends?.averageOrderValue > 0
                                                )
                                                .sort((a, b) => {
                                                    const aValue = a.trends?.[trendsSortCriteria] || 0;
                                                    const bValue = b.trends?.[trendsSortCriteria] || 0;
                                                    return trendsSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                                                })
                                                .map((supplier) => (
                                                    <TableRow key={supplier.supplierId}>
                                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                                        <TableCell className={`text-right ${(supplier.trends?.revenueGrowth || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {(supplier.trends?.revenueGrowth || 0).toFixed(1)}%
                                                        </TableCell>
                                                        <TableCell className={`text-right ${(supplier.trends?.profitGrowth || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {(supplier.trends?.profitGrowth || 0).toFixed(1)}%
                                                        </TableCell>
                                                        <TableCell>{supplier.trends?.topGrowingProduct || 'N/A'}</TableCell>
                                                        <TableCell className="text-right">
                                                            {(supplier.trends?.productGrowthRate || 0) === Infinity
                                                                ? 'New'
                                                                : `${(supplier.trends?.productGrowthRate || 0).toFixed(1)}%`}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            ₹{(supplier.trends?.averageOrderValue || 0).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {(supplier.trends?.productDiversityScore || 0).toFixed(1)}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="products">
                                    <Card className="mb-4">
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold">Product Performance Analysis</h3>
                                                <div className="text-sm text-muted-foreground space-y-2">
                                                    <p><span className="font-medium">Units Sold:</span> Total quantity sold. High numbers indicate popular items.</p>
                                                    <p><span className="font-medium">Revenue & Profit:</span> Absolute performance metrics. Compare across products to identify top earners.</p>
                                                    <p><span className="font-medium">Margin:</span> Profit percentage. Products with low margins might need price adjustments.</p>
                                                    <p><span className="font-medium">Growth:</span> Month-over-month sales growth. Negative values may need marketing attention.</p>
                                                    <p><span className="font-medium">Avg Order Size:</span> Typical purchase quantity. Low values might indicate retail sales, high values suggest wholesale.</p>
                                                </div>
                                                <div className="text-sm mt-2">
                                                    <span className="font-medium">Best Practices:</span>
                                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                                        <li>Focus on products with high margins but low growth for marketing opportunities</li>
                                                        <li>Review low-margin products with high sales volume for pricing optimization</li>
                                                        <li>Monitor average order sizes to identify potential bulk-buying opportunities</li>
                                                        <li>Use sorting options to identify underperforming products that need attention</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div className="flex gap-4 mb-4">
                                        <select
                                            value={productsSortCriteria}
                                            onChange={(e) => setProductsSortCriteria(e.target.value)}
                                            className="p-2 border rounded bg-primary-foreground"
                                        >
                                            <option value="revenue">Revenue</option>
                                            <option value="profit">Profit</option>
                                            <option value="margin">Margin</option>
                                            <option value="unitsSold">Units Sold</option>
                                            <option value="growth">Growth Rate</option>
                                            <option value="averageOrderSize">Avg Order Size</option>
                                        </select>
                                        <select
                                            value={productsSortOrder}
                                            onChange={(e) => setProductsSortOrder(e.target.value)}
                                            className="p-2 border rounded bg-primary-foreground"
                                        >
                                            <option value="desc">Highest First</option>
                                            <option value="asc">Lowest First</option>
                                        </select>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-right">Units Sold</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                                <TableHead className="text-right">Margin</TableHead>
                                                <TableHead className="text-right">Growth</TableHead>
                                                <TableHead className="text-right">Avg Order Size</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enhancedSupplierAnalysis
                                                .filter(supplier => supplier.totalRevenue > 0)
                                                .flatMap((supplier) =>
                                                    supplier.products
                                                        .filter((product: SupplierProduct) => product.revenue > 0)
                                                        .map((product: SupplierProduct) => ({
                                                            ...product,
                                                            supplierId: supplier.supplierId,
                                                            supplierName: supplier.name
                                                        }))
                                                )
                                                .sort((a, b) => {
                                                    const aValue = a[productsSortCriteria] || 0;
                                                    const bValue = b[productsSortCriteria] || 0;
                                                    return productsSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                                                })
                                                .map((product) => (
                                                    <TableRow key={`${product.supplierId}-${product.name}`}>
                                                        <TableCell className="font-medium">{product.name}</TableCell>
                                                        <TableCell className="text-right">{product.unitsSold || 0}</TableCell>
                                                        <TableCell className="text-right">₹{(product.revenue || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">₹{(product.profit || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">{(product.margin || 0).toFixed(1)}%</TableCell>
                                                        <TableCell className={`text-right ${(product.growth || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {product.growth === Infinity ? 'New' : `${(product.growth || 0).toFixed(1)}%`}
                                                        </TableCell>
                                                        <TableCell className="text-right">{(product.averageOrderSize || 0).toFixed(1)}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Suppliers Performance Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 p-2 border rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium">Select Suppliers to Display:</div>
                                    <div className="flex gap-2">
                                        <select
                                            className="p-2 border rounded bg-primary-foreground text-sm"
                                            onChange={(e) => setTimelineMetric(e.target.value as 'revenue' | 'profit' | 'unitsSold' | 'margin' | 'productsSold')}
                                            value={timelineMetric}
                                        >
                                            <option value="revenue">Revenue</option>
                                            <option value="profit">Profit</option>
                                            <option value="unitsSold">Units Sold</option>
                                            <option value="margin">Profit Margin</option>
                                            <option value="productsSold">Products Sold</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {enhancedSupplierAnalysis.map((supplier) => (
                                        <button
                                            key={supplier.supplierId}
                                            onClick={() => {
                                                setSelectedTimelineSuppliers(prev =>
                                                    prev.includes(supplier.supplierId)
                                                        ? prev.filter(id => id !== supplier.supplierId)
                                                        : [...prev, supplier.supplierId]
                                                );
                                            }}
                                            className={`px-3 py-1 rounded-full text-sm ${selectedTimelineSuppliers.includes(supplier.supplierId) ||
                                                selectedTimelineSuppliers.length === 0
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80'
                                                }`}
                                        >
                                            {supplier.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            type="category"
                                            allowDuplicatedCategory={false}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-background p-3 border rounded-lg shadow-lg">
                                                            <p className="text-sm font-medium mb-2">{label}</p>
                                                            {payload.map((entry: any) => (
                                                                <div key={entry.name} className="text-sm">
                                                                    <span style={{ color: entry.color }}>
                                                                        {entry.name}: {
                                                                            timelineMetric === 'margin'
                                                                                ? `${entry.value.toFixed(1)}%`
                                                                                : timelineMetric === 'revenue' || timelineMetric === 'profit'
                                                                                    ? `₹${entry.value.toFixed(2)}`
                                                                                    : entry.value
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend />
                                        {enhancedSupplierAnalysis
                                            .filter(supplier =>
                                                selectedTimelineSuppliers.length === 0 ||
                                                selectedTimelineSuppliers.includes(supplier.supplierId)
                                            )
                                            .map((supplier) => {
                                                // Create a map of all dates first
                                                const dateMap = new Map();
                                                data.forEach(invoice => {
                                                    dateMap.set(invoice.date, {
                                                        date: invoice.date,
                                                        revenue: 0,
                                                        profit: 0,
                                                        unitsSold: 0,
                                                        margin: 0,
                                                        productsSold: 0
                                                    });
                                                });

                                                // Fill in the data for dates where this supplier had sales
                                                data.forEach(invoice => {
                                                    try {
                                                        const invoiceProducts = JSON.parse(invoice.products);
                                                        const supplierProducts = products.filter(
                                                            p => p.supplier === supplier.supplierId
                                                        );

                                                        let dailyRevenue = 0;
                                                        let dailyProfit = 0;
                                                        let dailyUnits = 0;
                                                        const productsCount = new Set();

                                                        invoiceProducts.forEach((product: any) => {
                                                            const productData = supplierProducts.find(p =>
                                                                p.name.toLowerCase().trim() === product.name.toLowerCase().trim()
                                                            );
                                                            if (productData) {
                                                                dailyRevenue += product.price * product.quantity;
                                                                dailyProfit += (product.price - productData.cost) * product.quantity;
                                                                dailyUnits += product.quantity;
                                                                productsCount.add(product.name);
                                                            }
                                                        });

                                                        if (dateMap.has(invoice.date)) {
                                                            const dayData = dateMap.get(invoice.date);
                                                            dayData.revenue += dailyRevenue;
                                                            dayData.profit += dailyProfit;
                                                            dayData.unitsSold += dailyUnits;
                                                            dayData.productsSold = productsCount.size;
                                                            dayData.margin = dayData.revenue > 0 ? (dayData.profit / dayData.revenue) * 100 : 0;
                                                        }
                                                    } catch (error) {
                                                        console.error(`Error parsing invoice products:`, error);
                                                    }
                                                });

                                                // Convert map to array and sort by date
                                                const timelineData = Array.from(dateMap.values())
                                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                                return (
                                                    <Line
                                                        key={supplier.supplierId}
                                                        type="monotone"
                                                        data={timelineData}
                                                        dataKey={timelineMetric}
                                                        name={supplier.name}
                                                        stroke={`hsl(${parseInt(supplier.supplierId) * 137.508 % 360}, 70%, 50%)`}
                                                        dot={false}
                                                        connectNulls
                                                    />
                                                );
                                            })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add a supplier comparison chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Supplier Profit Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={enhancedSupplierAnalysis.slice(0, 6)}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="profit" fill="#0ea5e9" name="Profit" />
                                        <Bar dataKey="totalRevenue" fill="#f59e0b" name="Revenue" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add this inside TabsContent value="supplierProfit" */}
                    {selectedSupplier && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold">
                                            Supplier Analysis: {selectedSupplier.supplier.name}
                                        </h2>
                                        <button
                                            onClick={() => setSelectedSupplier(null)}
                                            className="p-2 hover:bg-muted rounded-full"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        {/* Overview metrics */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Performance Overview</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Total Revenue:</span>
                                                    <span>₹{selectedSupplier.overview.totalRevenue.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Total Profit:</span>
                                                    <span>₹{selectedSupplier.overview.totalProfit.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Average Margin:</span>
                                                    <span>{selectedSupplier.overview.averageMargin.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Products:</span>
                                                    <span>{selectedSupplier.overview.productCount}</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Timeline Chart */}
                                        <Card className="col-span-2">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Performance Over Time</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-[200px] text-black">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={selectedSupplier.timeline}>
                                                            <XAxis dataKey="date" />
                                                            <YAxis yAxisId="left" />
                                                            <YAxis yAxisId="right" orientation="right" />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line
                                                                yAxisId="left"
                                                                type="monotone"
                                                                dataKey="revenue"
                                                                stroke="#f59e0b"
                                                                name="Revenue"
                                                            />
                                                            <Line
                                                                yAxisId="right"
                                                                type="monotone"
                                                                dataKey="profit"
                                                                stroke="#0ea5e9"
                                                                name="Profit"
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Product Performance Table */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Product Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Product</TableHead>
                                                        <TableHead className="text-right">Units Sold</TableHead>
                                                        <TableHead className="text-right">Revenue</TableHead>
                                                        <TableHead className="text-right">Profit</TableHead>
                                                        <TableHead className="text-right">Margin</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedSupplier.products.map((product) => (
                                                        <TableRow key={product.name}>
                                                            <TableCell>{product.name}</TableCell>
                                                            <TableCell className="text-right">{product.unitsSold}</TableCell>
                                                            <TableCell className="text-right">₹{product.revenue.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">₹{product.profit.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">{product.margin.toFixed(1)}%</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}


                </TabsContent>



                <TabsContent value="invoiceAnalysis" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Performance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4 flex-wrap">
                                <select
                                    value={invoiceSortCriteria}
                                    onChange={(e) => setInvoiceSortCriteria(e.target.value as InvoiceSortKey)}
                                    className="p-2 border rounded bg-primary-foreground"
                                >
                                    <option value="date">Date</option>
                                    <option value="customer">Customer</option>
                                    <option value="totalRevenue">Revenue</option>
                                    <option value="profit">Profit</option>
                                    <option value="profitMargin">Margin</option>
                                    <option value="totalItems">Items Sold</option>
                                </select>
                                <select
                                    value={invoiceSortOrder}
                                    onChange={(e) => setInvoiceSortOrder(e.target.value as 'asc' | 'desc')}
                                    className="p-2 border rounded bg-primary-foreground"
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Filter by customer or invoice ID..."
                                    value={invoiceFilterText}
                                    onChange={(e) => setInvoiceFilterText(e.target.value)}
                                    className="p-2 border rounded bg-primary-foreground flex-grow"
                                />
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="groupByCustomer"
                                        checked={groupByCustomer}
                                        onChange={(e) => setGroupByCustomer(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="groupByCustomer">Group by Customer</label>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Items Sold</TableHead>
                                        <TableHead className="text-right">Product Count</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                        <TableHead className="text-right">Margin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredInvoices.map((item, index) => {
                                        // Check if this is a customer header row
                                        if ('isCustomerHeader' in item) {
                                            return (
                                                <TableRow key={`header-${item.customer}`} className="bg-muted">
                                                    <TableCell colSpan={2} className="font-bold">
                                                        Customer Group:
                                                    </TableCell>
                                                    <TableCell colSpan={2} className="font-bold">
                                                        {item.customer}
                                                    </TableCell>
                                                    <TableCell colSpan={5} className="text-right">
                                                        {item.count} invoice(s)
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }

                                        // Regular invoice row
                                        const invoice = item as InvoiceAnalysis;
                                        return (
                                            <TableRow
                                                key={invoice.invoiceId}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleInvoiceClick(invoice)}
                                            >
                                                <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                                                <TableCell>{invoice.date}</TableCell>
                                                <TableCell>{invoice.customer}</TableCell>
                                                <TableCell className="text-right">{invoice.totalItems}</TableCell>
                                                <TableCell className="text-right">{invoice.productCount}</TableCell>
                                                <TableCell className="text-right">₹{invoice.totalRevenue.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">₹{invoice.totalCost.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">₹{invoice.profit.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{invoice.profitMargin.toFixed(1)}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            <div className="text-xs text-muted-foreground mt-2">
                                Click on an invoice to view detailed profit analysis
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add a chart showing top invoices by profit */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Top 5 Invoices by Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={invoiceAnalysis.sort((a, b) => b.profit - a.profit).slice(0, 5)}>
                                        <XAxis dataKey="invoiceId" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="profit" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Detail Modal */}
                    {selectedInvoice && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold">Invoice Detail: {selectedInvoice.invoiceId}</h2>
                                        <button
                                            onClick={closeInvoiceDetail}
                                            className="p-2 hover:bg-muted rounded-full"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Invoice Information</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Date:</span>
                                                    <span>{selectedInvoice.date}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Customer:</span>
                                                    <span>{selectedInvoice.customer}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Items Sold:</span>
                                                    <span>{selectedInvoice.totalItems}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Product Count:</span>
                                                    <span>{selectedInvoice.productCount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Profit Analysis</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Revenue:</span>
                                                    <span className="font-medium">₹{selectedInvoice.totalRevenue.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Cost:</span>
                                                    <span className="font-medium">₹{selectedInvoice.totalCost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Profit:</span>
                                                    <span className="font-bold text-green-600">₹{selectedInvoice.profit.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Profit Margin:</span>
                                                    <span className="font-bold text-green-600">{selectedInvoice.profitMargin.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold mb-2">Product Details</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                                <TableHead className="text-right">Unit Cost</TableHead>
                                                <TableHead className="text-right">Total Revenue</TableHead>
                                                <TableHead className="text-right">Total Cost</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                                <TableHead className="text-right">Margin</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedInvoice.products.map((product, idx) => (
                                                <TableRow key={`${selectedInvoice.invoiceId}-${idx}`}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell className="text-right">{product.quantity}</TableCell>
                                                    <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">₹{product.cost.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">₹{(product.price * product.quantity).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">₹{(product.cost * product.quantity).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">₹{product.profit.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{product.profitMargin.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-right">
                                                        {product.isEstimated ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span className="text-yellow-500">Estimated</span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setProductToAdd({
                                                                        name: product.name,
                                                                        cost: product.cost
                                                                    })}
                                                                >
                                                                    Add to Database
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-green-500">Matched</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-2">Profit Breakdown</h3>
                                        <div className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={selectedInvoice.products}>
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="profit" fill="#0ea5e9" name="Profit" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={closeInvoiceDetail}
                                            className="px-4 py-2 bg-primary-foreground text-white rounded hover:bg-primary-foreground/90"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>


            <AddProductDialog
                open={!!productToAdd}
                onOpenChange={(open) => !open && setProductToAdd(null)}
                productName={productToAdd?.name || ''}
                estimatedCost={productToAdd?.cost || 0}
                suppliers={suppliers}
                onSuccess={() => {
                    setProductToAdd(null);
                    onProductAdded(); // Call the refresh function
                }}
            />

        </div>
    );
}