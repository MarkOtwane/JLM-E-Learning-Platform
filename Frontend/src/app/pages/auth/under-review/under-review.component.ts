import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-under-review',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './under-review.component.html',
  styleUrls: ['./under-review.component.css']
})
export class UnderReviewComponent {}
