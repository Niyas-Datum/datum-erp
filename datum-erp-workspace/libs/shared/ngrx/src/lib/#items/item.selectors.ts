import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ItemState } from './item.state';
import { itemFeatureKey } from './item.reducer';

export const selectItemState = createFeatureSelector<ItemState>(itemFeatureKey);

export const selectAllItem = createSelector(
  selectItemState,
  (state) => state.items
);