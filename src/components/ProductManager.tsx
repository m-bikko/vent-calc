'use client';

import React, { useEffect, useState } from 'react';
import { IProduct } from '@/types';
import { Trash2, Edit2, Plus, Calculator as CalcIcon } from 'lucide-react';
import AdminProductForm from './AdminProductForm';
import Calculator from './Calculator';
import clsx from 'clsx';

interface AddedItem {
    instanceId: string;
    product: IProduct;
}

export default function ProductManager() {
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    // Catalog Management
    const [editingProduct, setEditingProduct] = useState<IProduct | undefined>(undefined);
    const [showForm, setShowForm] = useState(false);

    // Calculation List
    const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this product template?')) return;
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchProducts();
    };

    const addToList = (product: IProduct) => {
        const newItem: AddedItem = {
            instanceId: crypto.randomUUID(),
            product: product
        };
        setAddedItems(prev => [...prev, newItem]);
    };

    const removeFromList = (instanceId: string) => {
        setAddedItems(prev => prev.filter(item => item.instanceId !== instanceId));
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Ventilation Calculator</h1>
                    <p className="text-gray-500 mt-1">Add items from catalog to build your calculation sheet</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(undefined);
                        setShowForm(!showForm);
                    }}
                    className={clsx(
                        "px-4 py-2 rounded-lg font-medium transition-colors",
                        showForm ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-black text-white hover:bg-gray-800"
                    )}
                >
                    {showForm ? 'Cancel' : '+ New Product Template'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Product Catalog (1/4 width) */}
                <div className="lg:col-span-1 space-y-6">
                    {showForm ? (
                        <AdminProductForm
                            initialData={editingProduct}
                            onSuccess={() => {
                                fetchProducts();
                                setShowForm(false);
                                setEditingProduct(undefined);
                            }}
                        />
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
                            <div className="p-4 bg-gray-50 border-b border-gray-100 font-medium text-gray-700 flex justify-between items-center">
                                <span>Catalog</span>
                                <span className="text-xs text-gray-400 font-normal">{products.length} Items</span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {loading ? (
                                    <p className="p-4 text-center text-gray-400">Loading...</p>
                                ) : products.length === 0 ? (
                                    <p className="p-4 text-center text-gray-400">No products found.</p>
                                ) : (
                                    products.map(p => (
                                        <div
                                            key={p._id}
                                            className="p-4 hover:bg-gray-50 transition-colors group relative"
                                        >
                                            <div className="flex items-center gap-3">
                                                {p.photoUrl ? (
                                                    <img src={p.photoUrl} alt="" className="w-12 h-12 rounded bg-gray-200 object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <CalcIcon size={20} />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                                                    <div className="flex gap-2 text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingProduct(p);
                                                                setShowForm(true);
                                                            }}
                                                            className="hover:text-blue-600"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteProduct(p._id, e)}
                                                            className="hover:text-red-600"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addToList(p)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors shadow-sm"
                                                    title="Add to calculation"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Calculation List (3/4 width) */}
                <div className="lg:col-span-3 space-y-6">
                    {addedItems.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 h-96 flex flex-col items-center justify-center text-gray-400">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Plus size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-600">Your Calculation Sheet is Empty</h3>
                            <p className="mt-1 text-sm">Select products from the catalog on the left to start calculating.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {addedItems.map((item) => (
                                <Calculator
                                    key={item.instanceId}
                                    product={item.product}
                                    onRemove={() => removeFromList(item.instanceId)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
