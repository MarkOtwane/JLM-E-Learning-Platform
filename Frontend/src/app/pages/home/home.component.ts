import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  reviews = [
    { text: 'This platform helped me land my first tech job!', author: 'Grace A.' },
    { text: 'Courses are clear and mentors are amazing.', author: 'John M.' },
    { text: 'Exactly what I needed to build confidence in coding.', author: 'Fatima O.' }
  ];

  activeReview = 0;

  constructor() {
    setInterval(() => {
      this.activeReview = (this.activeReview + 1) % this.reviews.length;
    }, 4000);
  }
}
