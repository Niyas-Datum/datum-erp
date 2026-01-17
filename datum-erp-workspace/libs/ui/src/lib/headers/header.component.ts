import { Component } from '@angular/core';

@Component({
  selector: 'app-base-header',
  standalone: true,
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
    <a class="navbar-brand" href="#">
    Datum Innovation
    </a>
    <div class="language-switch">
      <select id="languageSelector" class="form-select form-select-sm">
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
    </div>
  </nav>
   

    `
})
export class HeaderComponent {}