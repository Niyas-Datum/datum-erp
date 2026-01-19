import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EndpointConstant } from '@org/constants';
import { CommonModule } from '@angular/common';
import { CoreService } from '../../services/core.service';
  // Adjust path as necessary

@Component({
  selector: 'app-notificationlist',
  
  imports: [CommonModule],
  templateUrl: './notificationlist.component.html',
  styleUrls: ['./notificationlist.component.css'],
})
export class NotificationlistComponent implements OnInit {
  notifications: any; // Array to store the notifications
  private coreService = inject(CoreService);
  http = inject(HttpClient);

  ngOnInit(): void {
    this.loadNotifications();
  }


   loadNotifications(): void {
    const apiUrl = `${EndpointConstant.FETCHNOTIFICATION}`;
    this.coreService.fetch<any[]>(apiUrl).subscribe(
      (data) => {
        this.notifications = data;
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );
  }
  

}
