import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  visible = true;

  close() {
    this.visible = false;
  }

  ngOnInit() {
  setTimeout(() => this.visible = false, 5000);
}

}
