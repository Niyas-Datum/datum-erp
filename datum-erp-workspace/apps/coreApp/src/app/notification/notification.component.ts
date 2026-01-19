import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '@org/services';
@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
})
export class NotificationComponent implements OnInit {
  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    this.signalRService.startConnection();
  }

    private notification = {
      UniqueKeyID: '' + Math.random().toString(36).substring(2, 15),
      Message: 'New item added to inventory',
      Module: 'Inventory',
      ItemID: '67890',
      DateTime: new Date(),
      UserName: 'user1',
      RoleId :1,
      IsRead: false
    };
    
  sendNotification() {
    const message = `Branch created at ${new Date().toLocaleTimeString()}`;
    this.signalRService.sendNotification(this.notification);
  }
}