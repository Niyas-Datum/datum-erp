import { createReducer, on } from '@ngrx/store';
import * as ItemActions from './item.action';
import { initialItemState } from './item.state';

export const itemFeatureKey = 'item';

export const itemReducer = createReducer(
  initialItemState,
  on(ItemActions.loadItemsSuccess, (state, { items }) => ({
    ...state,
    items,
  })),

  /// Add new item
   on(ItemActions.addItem, (state, { item }) => ({
    ...state,
    items: [...state.items, item]
  })),

  // Update
  on(ItemActions.updateItem, (state, { item }) => ({
    ...state,
    items: state.items.map(i => i.id === item.id ? item : i)
  })),

  // Delete
  on(ItemActions.deleteItem, (state, { itemId }) => ({
    ...state,
    items: state.items.filter(i => i.id !== itemId)
  }))
);

