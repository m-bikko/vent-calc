'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { IProduct, IVariable } from '@/types';

interface AdminProductFormProps {
    initialData?: IProduct;
    onSuccess: () => void;
}

export default function AdminProductForm({ initialData, onSuccess }: AdminProductFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '');
    const [formula, setFormula] = useState(initialData?.formula || '');
    const [variables, setVariables] = useState<IVariable[]>(
        initialData?.variables || []
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addVariable = () => {
        setVariables([...variables, { name: '', label: '' }]);
    };

    const removeVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    const updateVariable = (index: number, field: keyof IVariable, value: any) => {
        const newVariables = [...variables];
        newVariables[index] = { ...newVariables[index], [field]: value };
        setVariables(newVariables);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = initialData
                ? `/api/products/${initialData._id}`
                : '/api/products';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, photoUrl, variables, formula }),
            });

            if (!res.ok) throw new Error('Failed to save product');

            onSuccess();
            if (!initialData) {
                // Reset form on create
                setName('');
                setPhotoUrl('');
                setFormula('');
                setVariables([]);
            }
        } catch (err) {
            setError('Ошибка сохранения товара');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {initialData ? 'Редактировать товар' : 'Создать новый товар'}
            </h2>

            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название товара</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                        placeholder="Напр. Прямоугольный воздуховод"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на фото (URL)</label>
                    <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                        placeholder="https://example.com/image.png"
                    />
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Переменные</label>
                    <button
                        type="button"
                        onClick={addVariable}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus size={16} /> Добавить переменную
                    </button>
                </div>

                <div className="space-y-3">
                    {variables.map((v, index) => (
                        <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={v.name}
                                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                    placeholder="Имя переменной (напр. A)"
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Используется в формуле</p>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={v.label}
                                    onChange={(e) => updateVariable(index, 'label', e.target.value)}
                                    placeholder="Метка (напр. Ширина)"
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeVariable(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {variables.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Переменные не заданы. Нажмите "Добавить переменную".
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Формула расчета</label>
                <div className="relative">
                    <textarea
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        className="w-full p-4 bg-gray-900 text-green-400 font-mono rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Напр. (A + B) * 2 * length"
                        rows={3}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Используйте имена переменных выше + мат. операторы (+, -, *, /, ^ и др).<br />
                        <b>PI</b> доступна как константа (3.14).<br />
                        Пример: <code>width * height * PI</code>
                    </p>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-all shadow-md active:scale-[0.98]"
            >
                <Save size={20} />
                {loading ? 'Сохранение...' : 'Сохранить товар'}
            </button>
        </form>
    );
}
