import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice } from './dashboard-content';

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

interface ProductAnalyticsProps {
    data: Invoice[];
    products: {
        id: string;
        name: string;
        cost: number;
        sellingPrice: number;
    }[];
}

export function ProductAnalytics({ data, products }: ProductAnalyticsProps) {
    const { productAnalysis, unmatchedProducts, averageProfitMargin } = useMemo(() => {
        const analysis = new Map<string, ProductAnalysis>();
        const unmatched = new Map<string, ProductAnalysis>();
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

        return {
            productAnalysis: [...matchedProducts, ...unmatchedProductsArray].sort((a, b) => b.profit - a.profit),
            unmatchedProducts: unmatchedProductsArray,
            averageProfitMargin: avgMargin
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




    const totalProfit = productAnalysis.reduce((sum, product) => sum + product.profit, 0);
    const topPerformers = productAnalysis.slice(0, 5);

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
                                <TableHead className="text-right">Margin</TableHead>
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
                                            <span className="text-yellow-500">Estimated</span>
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
        </div>
    );
}