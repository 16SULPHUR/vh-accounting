import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, Product, Supplier } from './dashboard-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '../ui/button';
import { AddProductDialog } from './AddProductDialog';

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

type InvoiceSortKey = keyof Pick<InvoiceAnalysis, 'date' | 'customer' | 'totalRevenue' | 'profit' | 'profitMargin' | 'totalItems'>;


export function ProductAnalytics({ data, products, suppliers, onProductAdded }: ProductAnalyticsProps) {

    const [productToAdd, setProductToAdd] = useState<{ name: string; cost: number } | null>(null);

    const closeInvoiceDetail = () => setSelectedInvoice(null);
    const handleInvoiceClick = (invoice: InvoiceAnalysis) => {
        setSelectedInvoice(invoice);
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

            // Find top product by profit
            let topProduct = { name: '', profit: 0 };
            let lowestMarginProduct = { name: '', margin: Infinity };

            supplierProducts.forEach(product => {
                const productAnalysisItem = productAnalysis.find(p => p.productId === product.id);
                if (productAnalysisItem) {
                    if (productAnalysisItem.profit > topProduct.profit) {
                        topProduct = {
                            name: productAnalysisItem.name,
                            profit: productAnalysisItem.profit
                        };
                    }

                    if (productAnalysisItem.profitMargin < lowestMarginProduct.margin) {
                        lowestMarginProduct = {
                            name: productAnalysisItem.name,
                            margin: productAnalysisItem.profitMargin
                        };
                    }
                }
            });

            return {
                ...supplier,
                name: supplierName,
                productCount: productVariety,
                topProduct: topProduct.name,
                topProductProfit: topProduct.profit,
                lowestMarginProduct: lowestMarginProduct.name,
                lowestMargin: lowestMarginProduct.margin
            };
        });
    }, [sortedAndFilteredSuppliers, suppliers, products, productAnalysis]);


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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead className="text-right">Products</TableHead>
                                        <TableHead className="text-right">Units Sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                        <TableHead className="text-right">Margin</TableHead>
                                        <TableHead>Top Product</TableHead>
                                        <TableHead>Lowest Margin Product</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enhancedSupplierAnalysis.map((supplier) => (
                                        <TableRow key={supplier.supplierId}>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell className="text-right">{supplier.productCount}</TableCell>
                                            <TableCell className="text-right">{supplier.totalUnitsSold}</TableCell>
                                            <TableCell className="text-right">₹{supplier.totalRevenue.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₹{supplier.profit.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{supplier.profitMargin.toFixed(1)}%</TableCell>
                                            <TableCell>{supplier.topProduct}</TableCell>
                                            <TableCell>
                                                {supplier.lowestMarginProduct}
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({supplier.lowestMargin.toFixed(1)}%)
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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