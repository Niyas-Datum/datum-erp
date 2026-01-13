import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { APP_URL } from '../../../utils/src/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private isConnected = false;

  private notificationSubject = new BehaviorSubject<any[]>([]);
  public notifications$ = this.notificationSubject.asObservable();

  public startConnection(): void {
    if (this.hubConnection && this.isConnected) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${APP_URL.API}signalr`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (...args: any[]) => {
      if (args && args.length > 0) {
        const notification = args[0]; 
        const currentNotifications = this.notificationSubject.getValue();
        this.notificationSubject.next([notification, ...currentNotifications]);
      } else {
        console.warn('Received empty arguments:', args);
      }
    });

    this.hubConnection.start()
      .then(() => {
        this.isConnected = true;
        console.log('✅ SignalR Connected');
      })
      .catch((err) => {
        console.error('❌ SignalR Connection Error:', err);
      });
  }

  public async sendNotification(notification: any) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('BroadcastNotification', notification);
    } else {
      console.warn('⚠️ SignalR not connected.');
    }
  }

  public clearNotifications() {
    this.notificationSubject.next([]); 
  }
}
