import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnChanges,
  Output,
  ViewChild,
  SimpleChanges,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
  MultiColumnComboBoxModule,
  MultiColumnComboBoxComponent as Ej2MultiColumnCombo,
} from '@syncfusion/ej2-angular-multicolumn-combobox';

@Component({
  selector: 'app-multiColumnComboBox',
  standalone: true,
  imports: [MultiColumnComboBoxModule],
  templateUrl: './multiColumnComboBox.component.html',
  styleUrls: ['./multiColumnComboBox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiColumnComboBoxComponent),
      multi: true,
    },
  ],
})
export class MultiColumnComboBoxComponent
  implements ControlValueAccessor, AfterViewInit, OnChanges
{
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mcb') public mcb?: Ej2MultiColumnCombo;

  @Input() dataSource: any[] | any = [];
  @Input() fields = { text: 'text', value: 'value' };
  @Input() placeholder = '';
  @Input() popupWidth = '';
  @Input() columns: Array<{ field: string; header?: string; width?: number | string }> = [];

  // 👇 NEW input to allow external reset trigger
  @Input() resetTrigger = 0;

  @Output() rowSelected = new EventEmitter<any>();

  public localData: any[] = [];

  private onChangeFn: (v: any) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private _value: any = null;
  private valueApplied = false;

  writeValue(obj: any): void {
    this._value = obj;
    this.valueApplied = false;
    this.applyValueToInner();
  }
  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (this.mcb) {
      (this.mcb as any).setProperties({ enabled: !isDisabled }, true);
      this.mcb.dataBind();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.applyValueToInner(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.resolveDataSource(this.dataSource);
      setTimeout(() => this.applyValueToInner(), 0);
    }

    // 👇 NEW: clear when resetTrigger changes
    if (changes['resetTrigger'] && !changes['resetTrigger'].firstChange) {
      this.clearSelection();
    }
  }

  // Syncfusion row select
  handleSelect(e: any) {
    const row = e?.item ?? e?.itemData ?? null;
    const val = row ? row[this.fields.value] ?? row : e?.value ?? null;

    this._value = val;
    this.onChangeFn(val);
    this.onTouchedFn();
    this.rowSelected.emit(row ?? e);
  }

  handleChange(e: any) {
    const val = e?.value ?? null;
    this._value = val;
    this.onChangeFn(val);
  }

  private applyValueToInner() {
    if (!this.mcb) return;

    // If null/empty value, clear
    if (this._value == null || this._value === '') {
      this.mcb.value = '';
      this.mcb.text = '';
      this.mcb.dataBind();
      this.valueApplied = true;
      return;
    }

    const ds = this.localData || [];
    if (!ds.length) return;

    const valueField = this.fields.value;
    const match = ds.find(
      (item) =>
        item[valueField] === this._value ||
        String(item[valueField]) === String(this._value)
    );

    if (match) {
      this.mcb.value = match[valueField];
      this.mcb.dataBind();
      this.valueApplied = true;
    } else {
      this.mcb.value = this._value;
      this.mcb.dataBind();
      this.valueApplied = true;
    }
  }

  private resolveDataSource(ds: any) {
    if (!ds) {
      this.localData = [];
      return;
    }
    if (typeof ds === 'function') {
      try {
        const out = ds();
        if (out && typeof out.subscribe === 'function') {
          out.subscribe((result: any[]) => {
            this.localData = result || [];
            this.applyValueToInner();
            this.cdr.markForCheck();
          });
        } else {
          this.localData = out || [];
        }
      } catch {
        this.localData = [];
      }
      return;
    }
    if (ds && typeof ds.subscribe === 'function') {
      ds.subscribe((result: any[]) => {
        this.localData = result || [];
        this.applyValueToInner();
        this.cdr.markForCheck();
      });
      return;
    }
    if (Array.isArray(ds)) {
      this.localData = ds;
      return;
    }
    this.localData = ds ? [ds] : [];
  }

  onRowSelect(event: any) {
    this.rowSelected.emit(event);
  }

  // 👇 NEW helper: clear internal and visible value
  clearSelection(): void {
    if (this.mcb) {
      this.mcb.value = '';
      this.mcb.text = '';
      this.mcb.refresh();
    }
    this._value = null;
    this.onChangeFn(null);
    this.cdr.detectChanges();
  }
}
