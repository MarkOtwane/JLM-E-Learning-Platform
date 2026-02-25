import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { InstructorSidebarComponent } from '../sidebar/instructor-sidebar.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, InstructorSidebarComponent],
  templateUrl: './instructor-layout.component.html',
  styleUrls: ['./instructor-layout.component.css']
})
export class InstructorLayoutComponent implements OnInit {
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = user.firstName || user.email;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
