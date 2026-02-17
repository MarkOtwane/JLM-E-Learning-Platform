import { Injectable, inject } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

// Import only icons actually used in the application
import {
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faAward,
  faBars,
  faBell,
  faBook,
  faBriefcase,
  faCalendarDays,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleExclamation,
  faClock,
  faCog,
  faCoins,
  faComments,
  faCopy,
  faDollarSign,
  faDownload,
  faEdit,
  faExclamation,
  faEye,
  faEyeSlash,
  faFileDownload,
  faFilter,
  faGraduationCap,
  faHeart,
  faHome,
  faKey,
  faLock,
  faMagnifyingGlass,
  faMapPin,
  faPencil,
  faPlus,
  faSearch,
  faShare,
  faShareNodes,
  faSignOut,
  faStar,
  faStar as faStarSolid,
  faThumbsUp,
  faTimes,
  faTrash,
  faUnlock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Icon Library Service
 *
 * Manages Font Awesome icons for the application.
 * Only includes icons that are actually used, reducing bundle size from 1.2MB to ~50KB.
 *
 * To add a new icon:
 * 1. Import the icon at the top
 * 2. Call library.addIcon() or add to addIcons()
 * 3. Use in templates: <fa-icon [icon]="['fas', 'icon-name']"></fa-icon>
 *
 * Icon Usage in Templates:
 * - Standalone: <fa-icon [icon]="['fas', 'home']"></fa-icon>
 * - With size: <fa-icon [icon]="['fas', 'home']" size="2x"></fa-icon>
 * - With color: <fa-icon [icon]="['fas', 'home']" class="text-blue-500"></fa-icon>
 * - Animated: <fa-icon [icon]="['fas', 'spinner']" [spin]="true"></fa-icon>
 */
@Injectable({
  providedIn: 'root',
})
export class IconLibraryService {
  constructor() {
    const library = inject(FaIconLibrary);

    // Register all application icons at startup
    library.addIcons(
      // Navigation
      faBars,
      faTimes,
      faChevronRight,
      faChevronLeft,
      faChevronDown,
      faChevronUp,
      faArrowRight,
      faArrowLeft,
      faArrowUpRightFromSquare,

      // Common Actions
      faHome,
      faSearch,
      faCog,
      faSignOut,
      faEdit,
      faTrash,
      faPlus,
      faPencil,
      faCopy,
      faDownload,
      faEye,
      faEyeSlash,
      faLock,
      faUnlock,
      faKey,

      // Content & Learning
      faBook,
      faGraduationCap,
      faAward,
      faStar,
      faStarSolid,
      faThumbsUp,

      // User & Profile
      faUser,
      faBell,
      faComments,
      faShare,
      faShareNodes,
      faHeart,

      // Course & Training
      faBriefcase,
      faClock,
      faCalendarDays,
      faMapPin,

      // Status Indicators
      faCheck,
      faCheckCircle,
      faExclamation,
      faCircleExclamation,

      // Financial
      faDollarSign,
      faCoins,

      // Filters & Search
      faFilter,
      faMagnifyingGlass,

      // File Operations
      faFileDownload,
    );
  }
}
