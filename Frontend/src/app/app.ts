import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Frontend';
  hideFooter = false;
  hideNavbar = false;

 constructor(private router: Router) {
  this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      const url = event.urlAfterRedirects || event.url;

      const hiddenRoutes = ['/login', '/register', '/pending', '/under-review'];
this.hideFooter =
  hiddenRoutes.includes(url) ||
  url.startsWith('/student') ||
  url.startsWith('/instructor') ||
  url.startsWith('/admin');

      // Hide navbar on learning page
      this.hideNavbar = url.startsWith('/learning/course');
    }
  });
}

}
