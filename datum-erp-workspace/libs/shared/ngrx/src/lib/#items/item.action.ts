import { createAction, props } from '@ngrx/store';
import { ItemDto } from '@org/models';

export const loadItems = createAction('[Item] Load Items');
export const loadItemsSuccess = createAction('[Item] Load Items Success', props<{ items: ItemDto[] }>());
export const loadItemsFailure = createAction('[Item] Load Items Failure', props<{ error: any }>());

export const addItem = createAction('[Item] Add new Items', props<{ item: ItemDto }>());

// Update
export const updateItem = createAction('[Item] Update Item', props<{ item: ItemDto }>());

// Delete
export const deleteItem = createAction('[Item] Delete Item', props<{ itemId: number }>());