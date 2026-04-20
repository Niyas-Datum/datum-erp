import { HostListener, Directive } from '@angular/core';

@Directive() // important: not a real component
export abstract class ShortcutBaseComponent {

  @HostListener('document:keydown', ['$event'])
   handleShortcutKeyboardEvent(event: KeyboardEvent) {

    if (event.ctrlKey && event.key.toLowerCase() === 'h') {
      event.preventDefault();
      this.controlH_press();
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      this.controlM_press();
    }
  }

  // Default implementations (can be overridden)
  protected controlH_press(): void {}
  protected controlM_press(): void {}
}