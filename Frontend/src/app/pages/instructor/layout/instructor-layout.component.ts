import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { InstructorSidebarComponent } from '../sidebar/instructor-sidebar.component'; 

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, InstructorSidebarComponent],
  templateUrl: './instructor-layout.component.html',
  styleUrls: ['./instructor-layout.component.css']
})
export class InstructorLayoutComponent {}
