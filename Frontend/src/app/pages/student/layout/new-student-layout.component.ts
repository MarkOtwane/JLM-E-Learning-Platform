import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopNavbarComponent } from '../components/top-navbar/top-navbar.component';
import { StudentSidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
  selector: 'app-new-student-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TopNavbarComponent, StudentSidebarComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Top Navbar -->
      <app-top-navbar (sidebarToggle)="toggleSidebar()"></app-top-navbar>

      <!-- Sidebar -->
      <app-student-sidebar 
        [isOpen]="isSidebarOpen"
        (close)="closeSidebar()">
      </app-student-sidebar>

      <!-- Main Content Area -->
      <main 
        class="pt-16 transition-all duration-300 ease-in-out"
        [ngClass]="{
          'lg:ml-64': isSidebarOpen,
          'lg:ml-20': !isSidebarOpen
        }">
        <div class="p-4 md:p-6 lg:p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class NewStudentLayoutComponent implements OnInit {
  isSidebarOpen = true;
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
    // Close sidebar on mobile by default
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 1024;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }
}
