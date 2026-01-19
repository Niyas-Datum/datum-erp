import { computed, EventEmitter, input, Output } from "@angular/core";
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
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();

  onClick(action: 'new' | 'edit' | 'delete' | 'save' | 'print' | 'preview' | 'settings' | 'help') {
    switch (action) {
      case 'new': this.new.emit(); break;
      case 'edit': this.edit.emit(); break;
      case 'delete': this.delete.emit(); break;
      case 'save': this.save.emit(); break;
      case 'print': this.print.emit(); break;
      case 'preview': this.preview.emit(); break;
      case 'settings': this.settings.emit(); break;
      case 'help': this.help.emit(); break;
    }
  }
}

