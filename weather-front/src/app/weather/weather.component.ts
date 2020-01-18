import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../web-socket.service'

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {

  cities: [];

  constructor(private webSocketService: WebSocketService) {
    console.log(webSocketService)
  }

  ngOnInit() {
    let cities = [
      { name: 'Santiago' }
    ];
    this.webSocketService.messages().subscribe(ev => {
      console.log(ev)
      this.cities = JSON.parse(ev.data);
      this.cities.forEach((c: any) => {
        c.secondsAgo = Math.floor((Date.now() - c.updatedAt) / 1000);
      });
    })
  }

}
