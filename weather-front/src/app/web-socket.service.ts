import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// import WebSocket from 'ws'

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  ws: WebSocket
  constructor() {
    this.ws = new WebSocket('ws://127.0.0.1:3001');
    this.ws.onopen = (ev) => console.log('connected');
  }

  messages(): Observable<MessageEvent> {
    let observable = new Observable<MessageEvent>(observer => {
      this.ws.onmessage = (ev) => observer.next(ev);
      /* this.ws.on('message', (data) => {
        observer.next(data);    
      }); */
      return () => {
        this.ws.close();
      };
    })
    return observable;
  }
}
