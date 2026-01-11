export type InventoryItem = {
  id: string;
  name: string;
  kms: number;
  purchasePrice: number;
  salePrice: number;
  type: 'Propia' | 'Flip compartido';
  status: {
    name: 'ok' | 'En riesgo';
    days?: number;
  };
  imageUrl: string;
  imageHint: string;
};
