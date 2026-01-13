export interface ItemDto {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    category: string;
    imageUrl?: string; // Optional field for item image URL
    createdAt: Date; // Timestamp of when the item was created
    updatedAt: Date; // Timestamp of when the item was last updated
    }