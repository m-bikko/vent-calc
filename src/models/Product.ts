import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVariable {
    name: string; // The variable name used in formula (e.g., "A", "width")
    label: string; // Human readable label (e.g., "Width (mm)")
}

export interface IProduct extends Document {
    name: string;
    photoUrl: string;
    variables: IVariable[];
    formula: string; // e.g., "width * height / 100"
    createdAt: Date;
    updatedAt: Date;
}

const VariableSchema = new Schema<IVariable>({
    name: { type: String, required: true },
    label: { type: String, required: true },
});

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true },
        photoUrl: { type: String, required: false },
        variables: [VariableSchema],
        formula: { type: String, required: true },
    },
    { timestamps: true }
);

// Prevent overwriting model if already compiled
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
