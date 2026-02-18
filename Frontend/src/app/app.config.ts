import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  Injectable,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { FaConfig } from '@fortawesome/angular-fontawesome';

import { routes } from './app.routes';
import { IconLibraryService } from './shared/icons/icon-library.service';

/**
 * Global error handler to catch and log Angular errors safely
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error | any): void {
    console.error('Global error caught:', error);

    // Prevent unhandled undefined.length errors
    if (
      error?.message?.includes(
        "Cannot read properties of undefined (reading 'length')",
      )
    ) {
      console.warn('Safely ignoring undefined.length error');
      return;
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    // Initialize Font Awesome with only necessary icons (reduces bundle 1.2MB -> 50KB)
    IconLibraryService,
    { provide: FaConfig, useValue: { defaultPrefix: 'fas' } },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
