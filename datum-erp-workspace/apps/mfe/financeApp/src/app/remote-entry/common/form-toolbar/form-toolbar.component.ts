/* eslint-disable @angular-eslint/no-output-native */
import { EventEmitter, input, Output } from "@angular/core";
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-form-toolbar',
  standalone: true,
  templateUrl: './form-toolbar.component.html',
  styleUrl: './form-toolbar.component.css',
  imports: [CommonModule],
})
export class FormToolbarComponent {
  isNewMode = input(false);
  isEditMode = input(false);
  isNewBtnDisabled = input(false);
  isEditBtnDisabled = input(false);
  isDeleteBtnDisabled = input(false);
  isSaveBtnDisabled = input(false);
  isPrintBtnDisabled = input(false);

  @Output() new = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() email = new EventEmitter<void>();
  @Output() bills = new EventEmitter<void>();
  @Output() attach = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();
  @Output() importitems = new EventEmitter<void>();
  @Output() keys = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();



  onClick(action:
    'new' | 'save' | 'edit' | 'delete' |
    'print' | 'preview' | 'email' | 'bills' |
    'attach' | 'copy' | 'settings' | 'help' |
    'importitems' | 'keys' | 'export'
  ) {
    switch (action) {
      case 'new': this.new.emit(); break;
      case 'save': this.save.emit(); break;
      case 'edit': this.edit.emit(); break;
      case 'delete': this.delete.emit(); break;
      case 'print': this.print.emit(); break;
      case 'preview': this.preview.emit(); break;
      case 'email': this.email.emit(); break;
      case 'bills': this.bills.emit(); break;
      case 'attach': this.attach.emit(); break;
      case 'copy': this.copy.emit(); break;
      case 'settings': this.settings.emit(); break;
      case 'help': this.help.emit(); break;
      case 'importitems': this.importitems.emit(); break;
      case 'keys': this.keys.emit(); break;
      case 'export': this.export.emit(); break;
    }
  }



}

