# Missing Endpoint Constants for Voucher Module

## Overview
The following constants are required in `libs/constants/src/lib/endpoint.constants.ts` to support the new voucher components in the Finance App.

## File Location
`libs/constants/src/lib/endpoint.constants.ts`

## Missing Constants to Add

### Receipt Voucher Constants
```typescript
SAVERECEIPTVOUCHER:'api/v1/fn/receiptvou/save?PageId=',
UPDATERECEIPTVOUCHER:'api/v1/fn/receiptvou/update?PageId=',
DELETERECEIPTVOUCHER:'api/v1/fn/receiptvou/delete?PageId=',
```

### Journal Voucher Constants
```typescript
SAVEJOURNAL:'api/v1/fn/journalVoucher/save?pageId=',
UPDATEJOURNAL:'api/v1/fn/journalVoucher/update?pageId=',
DELETEJOURNAL:'api/v1/fn/journalVoucher/delete?PageId=',
```

### Contra Voucher Constants
```typescript
SAVECONTRAVOUCHER:'api/v1/fn/contravou/save?pageId=',
UPDATECONTRAVOUCHER:'api/v1/fn/contravou/update?pageId=',
DELETECONTRAVOUCHER:'api/v1/fn/contravou/delete?PageId=',
```

### Payment Voucher Constants
```typescript
DELETEPAYMENTVOUCHER:'api/v1/fn/paymentvou/delete?PageId=',
FILLVOUCHERALLOCATION:'api/v1/fn/paymentvou/billAndRef?TransId=',
```

### PDC Clearing Voucher Constants
```typescript
FILLPDCCHEQUES:'api/v1/fn/pdcclearing/fillCheqdet?BankId=',
SAVEPDCCLEARING:'api/v1/fn/pdcclearing/save?PageId=',
UPDATEPDCCLEARING:'api/v1/fn/pdcclearing/update?PageId=',
```

### Opening Voucher Constants
```typescript
SAVEOPENINGVOUCHER:'api/v1/fn/Openingvou/save?PageId=',
UPDATEOPENINGVOUCHER:'api/v1/fn/Openingvou/update?PageId=',
DELETEOPENINGVOUCHER:'api/v1/fn/Openingvou/delete?PageId=',
```

### General Voucher Constants
```typescript
VOUCHERDROPDOWN:'api/v1/fn/vchr/dropDown',
```

## Note on Existing Typos
The file currently contains these constants with typos:
- `SAVERECEIPTTVOUHER` (has double T, missing C in VOUCHER)
- `UPDATERECEIPTVOUHER` (missing C in VOUCHER)

The correctly spelled versions (`SAVERECEIPTVOUCHER`, `UPDATERECEIPTVOUCHER`) should be added as listed above.

## Reference
These constants were sourced from the working implementation at:
`C:\Users\HP\AngularProjects\Github_Projects\NewClone\Datum-workspace-frontend\libs\constants\src\lib\endpoint.constants.ts`

## Affected Components
The following voucher components require these constants:
- `receipt-voucher.component.ts`
- `payment-voucher.component.ts`
- `journal-voucher.component.ts`
- `contra-voucher.component.ts`
- `opening-voucher.component.ts`
- `pdc-clearing-voucher.component.ts`
- `credit-note.component.ts`
- `debit-note.component.ts`
- `account-reconciliation.component.ts`

## Date
Created: 2026-01-23
