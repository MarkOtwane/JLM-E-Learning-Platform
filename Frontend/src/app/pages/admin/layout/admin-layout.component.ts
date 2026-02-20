import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminSidebarComponent } from '../sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent {
  constructor(private router: Router) {}

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}

export default AdminLayoutComponent;
