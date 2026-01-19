import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LogLevel } from '@microsoft/signalr';

import { DataSharingService } from '@org/services';
import { EndpointConstant } from '@org/constants';
import { CoreService } from '../../services/core.service';

@Component({
  selector: 'app-notificationdetails',
  imports: [CommonModule],
  templateUrl: './notificationdetails.component.html',
  styleUrl: './notificationdetails.component.css',
})

export class NotificationdetailsComponent implements OnInit {
 
  notificationData: any;
  private datasharingService = inject(DataSharingService);
  private coreService = inject(CoreService);
  route = inject(ActivatedRoute);
  http = inject(HttpClient);

  ngOnInit(): void {
   
    this.notificationData = this.datasharingService.sharedData;
     if (this.notificationData) {
      this.fetchUserDetails(this.notificationData.userName, this.notificationData.uniqueKeyID);
    }
  }

  fetchUserDetails(userName: string, uniqueKeyID: string): void {
    const url =  `${EndpointConstant.FETCHNOTIFICATION}/${userName}/${uniqueKeyID}`;

    this.coreService.fetch<any>(url).subscribe(
      (data) => {
        this.notificationData = data;
      },
      (error) => {
        console.error('Error fetching notification details:', error);
      }
    );
  }
}  
