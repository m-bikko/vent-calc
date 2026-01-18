export interface IVariable {
    _id?: string; // Optional if new
    name: string;
    label: string;
}

export interface IProduct {
    _id: string;
    name: string;
    photoUrl: string;
    variables: IVariable[];
    formula: string;
    createdAt?: string;
    updatedAt?: string;
}
