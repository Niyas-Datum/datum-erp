import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '@org/services';



@Component({
  selector: 'app-notificationreciever',
  imports: [CommonModule],
  templateUrl: './notificationreciever.component.html',
  styleUrls: ['./notificationreciever.component.css'],
})
export class NotificationrecieverComponent implements OnInit {
  notifications: any[] = []; // Array to hold notifications

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
   this.signalRService.startConnection();
    // Subscribe to the notifications observable
    this.signalRService.notifications$.subscribe((msgs) => {
      this.notifications = msgs;
    });
  }

  clearNotifications() {
    this.signalRService.clearNotifications(); // Clear the notifications
  }
}
