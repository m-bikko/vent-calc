'use client';

import React, { useEffect, useState } from 'react';
import { IProduct } from '@/types';
import { Trash2, Edit2, Plus, Calculator as CalcIcon } from 'lucide-react';
import AdminProductForm from './AdminProductForm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Calculator, { CalculatorData } from './Calculator';
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

    // Store results from children calculators to generate PDF
    // Map instanceId -> Data
    const [resultsMap, setResultsMap] = useState<Record<string, CalculatorData>>({});

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
        setResultsMap(prev => {
            const next = { ...prev };
            delete next[instanceId];
            return next;
        });
    };

    const handleUpdateResult = (instanceId: string, data: CalculatorData) => {
        setResultsMap(prev => ({
            ...prev,
            [instanceId]: data
        }));
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF();

        try {
            const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
            if (!fontResponse.ok) throw new Error('Failed to load font');
            const fontBlob = await fontResponse.blob();

            const base64data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.readAsDataURL(fontBlob);
            });

            if (base64data) {
                // Determine font name - use a simple identifier
                const fontName = 'Roboto-Regular';
                const fontAlias = 'Roboto';

                doc.addFileToVFS('Roboto-Regular.ttf', base64data);
                doc.addFont('Roboto-Regular.ttf', fontAlias, 'normal');
                doc.setFont(fontAlias);
            }
        } catch (e) {
            console.error("Error loading font:", e);
            alert("Ошибка загрузки шрифта. PDF может отображаться некорректно.");
        }

        doc.setFontSize(18);
        doc.text("Коммерческое Предложение", 14, 22);

        doc.setFontSize(11);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 30);

        const tableBody = addedItems.map((item, index) => {
            const data = resultsMap[item.instanceId];
            if (!data) return [];

            // Format variables string "A: 10, B: 20"
            const vars = Object.entries(data.values)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');

            return [
                index + 1,
                item.product.name,
                vars || '-',
                data.quantity,
                data.result.toLocaleString('ru-RU', { maximumFractionDigits: 2 }),
                data.total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
            ];
        });

        // Calculate Grand Total
        const grandTotal = Object.values(resultsMap).reduce((sum, data) => sum += data.total, 0);

        // Add Grand Total Row
        tableBody.push(['', '', '', '', 'ИТОГО', grandTotal.toLocaleString('ru-RU', { maximumFractionDigits: 2 })]);

        autoTable(doc, {
            head: [['#', 'Товар', 'Параметры', 'Кол-во', 'Цена', 'Сумма']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66], font: 'Roboto' },
            styles: { font: 'Roboto', fontStyle: 'normal' },
        });

        doc.save("КП.pdf");
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Калькулятор Вентиляции</h1>
                    <p className="text-gray-500 mt-1">Добавьте товары из каталога для расчета</p>
                </div>
                <div className="flex gap-3">
                    {addedItems.length > 0 && (
                        <button
                            onClick={handleExportPDF}
                            className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Скачать КП
                        </button>
                    )}
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
                        {showForm ? 'Отмена' : '+ Новый Товар'}
                    </button>
                </div>
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
                                <span>Каталог</span>
                                <span className="text-xs text-gray-400 font-normal">{products.length} поз.</span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {loading ? (
                                    <p className="p-4 text-center text-gray-400">Загрузка...</p>
                                ) : products.length === 0 ? (
                                    <p className="p-4 text-center text-gray-400">Нет товаров.</p>
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
                                                            Изменить
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteProduct(p._id, e)}
                                                            className="hover:text-red-600"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addToList(p)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors shadow-sm"
                                                    title="Добавить в расчет"
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
                            <h3 className="text-lg font-medium text-gray-600">Список расчета пуст</h3>
                            <p className="mt-1 text-sm">Выберите товары из каталога слева, чтобы начать.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {addedItems.map((item) => (
                                <Calculator
                                    key={item.instanceId}
                                    product={item.product}
                                    onRemove={() => removeFromList(item.instanceId)}
                                    onUpdate={(data) => handleUpdateResult(item.instanceId, data)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Sticky Footer Total (optional, but good for UX) */}
                    {addedItems.length > 0 && (
                        <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:pl-96 lg:pl-[25%] z-10 flex justify-between items-center">
                            <div className="text-gray-500">
                                Всего позиций: <span className="font-bold text-gray-900">{addedItems.length}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">ИТОГО К ОПЛАТЕ</p>
                                    <p className="text-2xl font-bold font-mono text-blue-600">
                                        {Object.values(resultsMap).reduce((sum, d) => sum + d.total, 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <button
                                    onClick={handleExportPDF}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                                >
                                    Скачать КП
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Add padding for fixed footer */}
            <div className="h-24"></div>
        </div>
    );
}
