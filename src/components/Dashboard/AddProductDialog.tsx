import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner"
import { Supplier } from './dashboard-content';

interface AddProductDialogProps {
    productName: string;
    estimatedCost: number;
    suppliers: Supplier[]; // Change this to use your Supplier type
    onSuccess: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({
    productName,
    estimatedCost,
    suppliers,
    onSuccess,
    open,
    onOpenChange
}: AddProductDialogProps) {

    const [name, setName] = useState(productName);
    const [cost, setCost] = useState(estimatedCost.toString());
    const [sellingPrice, setSellingPrice] = useState(estimatedCost * 20);
    const [quantity, setQuantity] = useState("0");
    const [supplier, setSupplier] = useState<string | null>(null);
    const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const nameInput = useRef<HTMLInputElement>(null);

    // Add handlers with validation
    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
            setCost(value);
        }
    };

    const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
            setSellingPrice(value);
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
            setQuantity(value);
        }
    };

    const generateSupplierCode = async () => {
        const { data, error } = await supabase
            .from("suppliers")
            .select("code")
            .order("code", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching last supplier code:", error);
            return "001";
        }

        const lastCode = data[0]?.code || "000";
        const nextCode = (parseInt(lastCode, 10) + 1).toString().padStart(3, "0");
        return nextCode;
    };

    const generateProductCode = async () => {
        const { data, error } = await supabase
            .from("products")
            .select("barcode")
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching last product code:", error);
            return "00001";
        }

        const lastBarcode = data[0]?.barcode || "00000000";
        const lastProductCode = lastBarcode.toString().slice(-5);
        const nextProductCode = (parseInt(lastProductCode, 10) + 1)
            .toString()
            .padStart(5, "0");
        return nextProductCode;
    };

    const addNewSupplier = async () => {
        const newSupplierCode = await generateSupplierCode();
        const { data, error } = await supabase
            .from("suppliers")
            .insert([{ name: newSupplierName, code: newSupplierCode }])
            .select();

        if (error) {
            console.error("Error adding new supplier:", error);
            toast.error("Failed to add new supplier. Please try again.");
            return null;
        } else {
            console.log("New supplier added successfully:", data);
            return data[0];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Add validation
        if (!name || !cost || !sellingPrice || !quantity) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!supplier && !isAddingNewSupplier) {
            toast.error("Please select or add a supplier");
            return;
        }

        if (isAddingNewSupplier && !newSupplierName) {
            toast.error("Please enter supplier name");
            return;
        }

        try {
            let currentSupplier = supplier;
            let supplierCode;

            if (isAddingNewSupplier) {
                const newSupplier = await addNewSupplier();
                if (newSupplier) {
                    currentSupplier = newSupplier.id;
                    supplierCode = newSupplier.code;
                } else {
                    return;
                }
            } else {
                const selectedSupplier = suppliers.find((s) => s.id === supplier);
                console.log(selectedSupplier)
                if (!selectedSupplier) {
                    toast.error("Invalid supplier selected");
                    return;
                }
                supplierCode = selectedSupplier.code;
            }

            const productCode = await generateProductCode();
            const barcode = `${supplierCode}${productCode}`;

            console.log(currentSupplier)

            const { error } = await supabase.from("products").insert([
                {
                    name,
                    cost: parseInt(cost),
                    sellingPrice: parseInt(sellingPrice),
                    supplier: currentSupplier,
                    barcode,
                    quantity: parseInt(quantity, 10),
                },
            ]);

            if (error) throw error;

            toast.success("Product added successfully");
            onSuccess();
            onOpenChange(false);

        } catch (error) {
            console.error("Error adding product:", error);
            toast.error("Failed to add product. Please try again.");
        }
    };

    useEffect(() => {
        // Update state when props change
        setName(productName);
        setCost(estimatedCost.toString());
        setSellingPrice((estimatedCost * 1.2).toFixed(2));
    }, [productName, estimatedCost]);

    useEffect(() => {
        if (open) {
            // Focus the first editable field when dialog opens
            setTimeout(() => {
                if (nameInput.current) {
                    nameInput.current.select();
                }
            }, 0);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            ref={nameInput}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost">Cost Price</Label>
                        <Input
                            id="cost"
                            type="number"
                            value={parseInt(cost)}
                            onChange={handleCostChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sellingPrice">Selling Price</Label>
                        <Input
                            id="sellingPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={sellingPrice}
                            onChange={handleSellingPriceChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Initial Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={handleQuantityChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        {isAddingNewSupplier ? (
                            <div className="flex gap-2">
                                <Input
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    placeholder="Enter new supplier name"
                                />
                                <Button type="button" variant="outline" onClick={() => setIsAddingNewSupplier(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Select onValueChange={(value) => setSupplier(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={() => setIsAddingNewSupplier(true)}>
                                    Add New
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Add Product</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}