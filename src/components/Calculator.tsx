'use client';

import React, { useState, useEffect } from 'react';
import { IProduct } from '@/types';
import { evaluate } from 'mathjs';
import clsx from 'clsx';

interface CalculatorProps {
    product: IProduct;
    onRemove?: () => void;
}

export default function Calculator({ product, onRemove }: CalculatorProps) {
    const [values, setValues] = useState<Record<string, number>>({});
    const [result, setResult] = useState<number | string>(0);
    const [error, setError] = useState('');

    // Initialize empty values
    useEffect(() => {
        const initialValues: Record<string, number> = {};
        // We don't set default values anymore, just ensure the keys exist if needed
        // but actually we can just start empty.
        setValues({});
    }, [product]);

    // Calculate whenever values change
    useEffect(() => {
        try {
            // Only calculate if we have values for all variables
            const allVariablesSet = product.variables.every(v =>
                values[v.name] !== undefined && !isNaN(values[v.name])
            );

            if (!allVariablesSet || Object.keys(values).length === 0) {
                setResult('...'); // Show placeholder
                setError('');
                return;
            }

            // Sanitized scope with PI constant
            const scope = { ...values, PI: 3.14, pi: 3.14 }; // Support both cases

            const calculated = evaluate(product.formula, scope);
            setResult(calculated);
            setError('');
        } catch (err) {
            setResult('Error');
        }
    }, [values, product.formula, product.variables]); // Added product.variables dependency

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

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 relative group">
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from list"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
                {product.variables.map(v => (
                    <div key={v.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {v.label} <span className="text-gray-400 font-mono text-xs">({v.name})</span>
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={values[v.name] ?? ''}
                            onChange={(e) => handleChange(v.name, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                        />
                    </div>
                ))}
            </div>

            <div className={clsx(
                "p-4 rounded-lg text-center transition-colors",
                result === 'Error' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-900"
            )}>
                <p className="text-sm uppercase tracking-wide opacity-70 mb-1">Result</p>
                <p className="text-3xl font-bold font-mono">
                    {typeof result === 'number' ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : result}
                </p>
            </div>
        </div>
    );
}
