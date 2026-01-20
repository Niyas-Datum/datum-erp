import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataSharingService } from '@org/services';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions-component.html',
  imports: [CommonModule, RouterModule, RouterOutlet],
  standalone: true,
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dataSharingService = inject(DataSharingService);

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Initialize transaction module state
    // Note: selectedSalesId$ is an Observable, not a Subject
    // State will be managed by individual components
  }
}


  