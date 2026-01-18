'use client';

import React, { useState, useEffect } from 'react';
import { IProduct } from '@/types';
import { evaluate } from 'mathjs';
import clsx from 'clsx';
import { Trash2 } from 'lucide-react';

// Define the shape of data we want to bubble up
export interface CalculatorData {
    values: Record<string, number>;
    quantity: number;
    result: number;
    total: number;
}

interface CalculatorProps {
    product: IProduct;
    onRemove?: () => void;
    onUpdate?: (data: CalculatorData) => void;
}

export default function Calculator({ product, onRemove, onUpdate }: CalculatorProps) {
    const [values, setValues] = useState<Record<string, number>>({});
    const [quantity, setQuantity] = useState<number>(1);
    const [result, setResult] = useState<number | string>(0);
    const [error, setError] = useState('');

    // Refs to stabilize callback and prevent loops
    const onUpdateRef = React.useRef(onUpdate);
    const lastReportedDataRef = React.useRef<CalculatorData | null>(null);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    // Initialize empty values
    useEffect(() => {
        const initialValues: Record<string, number> = {};
        // We don't set default values anymore, just ensure the keys exist if needed
        // but actually we can just start empty.
        setValues({});
        setQuantity(1);
        lastReportedDataRef.current = null; // Reset last reported data on product change
    }, [product]);

    // Calculate whenever values change
    useEffect(() => {
        let calcResult: number | string = 0;
        let numResult = 0;

        try {
            // Only calculate if we have values for all variables
            const allVariablesSet = product.variables.every(v =>
                values[v.name] !== undefined && !isNaN(values[v.name])
            );

            if (!allVariablesSet || Object.keys(values).length === 0) {
                calcResult = '...';
                setError('');
            } else {
                // Sanitized scope with PI constant
                const scope = { ...values, PI: 3.14, pi: 3.14 }; // Support both cases
                calcResult = evaluate(product.formula, scope);
                setError('');
                if (typeof calcResult === 'number') {
                    numResult = calcResult;
                }
            }
            setResult(calcResult);
        } catch (err) {
            setResult('Error');
            calcResult = 'Error';
        }

        // Notify parent only if we have a valid update
        // We need to be careful not to create an infinite loop.
        // The parent update triggers a re-render.
        if (onUpdateRef.current) {
            const newData: CalculatorData = {
                values,
                quantity,
                result: typeof calcResult === 'number' ? calcResult : 0,
                total: typeof calcResult === 'number' ? calcResult * quantity : 0
            };

            // BETTER FIX: Wrap the onUpdate call in JSON.stringify check to avoid spamming same data
            // Check if the new data is different from the last reported data
            if (JSON.stringify(newData) !== JSON.stringify(lastReportedDataRef.current)) {
                onUpdateRef.current(newData);
                lastReportedDataRef.current = newData;
            }
        }

    }, [values, product.formula, product.variables, quantity]); // REMOVED onUpdate from dependency array to break loop if onUpdate instance changes.

    const handleChange = (name: string, val: string) => {
        // Allow empty string to clear the value
        if (val === '') {
            const newValues = { ...values };
            delete newValues[name];
            setValues(newValues);
            return;
        }

        const num = parseFloat(val);
        // Only update if it's a valid number (or partial number being typed like "1.")
        // But for state we usually want to store the number.
        // If we want to support typing "1.", we might need to store string values temporarily,
        // but given the current simple setup, we just store the number.
        // However, "1." parses to 1. So typing "." might be tricky if we fully controlled it back to number every time.
        // actually input type="number" usually handles this by keeping the local state of the input separate until valid.
        // But we are binding value={...}.

        // Let's rely on standard number behavior but fix the "0" default.
        if (!isNaN(num)) {
            setValues(prev => ({
                ...prev,
                [name]: num
            }));
        }
    };

    const handleQuantityChange = (val: string) => {
        const num = parseFloat(val);
        if (val === '') {
            setQuantity(0); // Treat empty as 0 temporarily or handle as you wish, but maybe 0 is safer for total calc
            return;
        }
        if (!isNaN(num) && num >= 0) {
            setQuantity(num);
        }
    };

    const total = typeof result === 'number' ? result * quantity : 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 relative group">
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from list"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    <Trash2 size={16} />
                </button>
            )}
            <div className="flex items-center gap-4 mb-6">
                {product.photoUrl && (
                    <img
                        src={product.photoUrl}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                    />
                )}
                <h2 className="text-xl font-bold text-gray-800 pr-8">{product.name}</h2>
            </div>

            <div className="space-y-4 mb-6">
                {product.variables.map(variable => (
                    <div key={variable.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.label} ({variable.name})
                        </label>
                        <input
                            type="number"
                            step="any" // Allow decimals
                            value={values[variable.name] !== undefined ? values[variable.name] : ''}
                            onChange={(e) => handleChange(variable.name, e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                            placeholder={`Введите значение для ${variable.name}`}
                        />
                    </div>
                ))}

                {/* Quantity Input */}
                <div className="pt-2 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Количество
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                    />
                </div>

                <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">Цена за ед.:</span>
                        <div className="text-right">
                            <div className="bg-gray-50 px-3 py-1 rounded text-sm font-medium text-gray-700 border border-gray-200">
                                {typeof result === 'number'
                                    ? result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
                                    : result}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <span className="font-medium text-gray-900">Сумма:</span>
                        <div className="bg-blue-50 px-4 py-2 rounded-lg font-bold text-blue-600 border border-blue-100 min-w-[100px] text-center text-2xl">
                            {typeof result === 'number'
                                ? total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
                                : '...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
