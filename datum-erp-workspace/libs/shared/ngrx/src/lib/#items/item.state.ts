import { ItemDto } from "@org/models";

export interface ItemState {
  items: ItemDto[];
}

export const initialItemState: ItemState = {
  items: []
};
