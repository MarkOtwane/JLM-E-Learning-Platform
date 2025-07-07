import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Import your AuthService
import { Observable } from 'rxjs';

interface CourseInstructor {
  name: string;
  profilePicture: string;
  bio?: string;
}

interface CourseReview {
  studentName: string;
  studentAvatar: string;
  rating: number;
  comment: string;
  date: Date;
}

interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  fullDescription?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  image: string;
  instructor: CourseInstructor;
  learners: number;
  rating: number;
  reviewsCount: number;
  reviews?: CourseReview[];
  curriculum?: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  @ViewChild('carouselWrapper', { static: false }) carouselWrapper!: ElementRef;

  courses: Course[] = [];
  filteredCourses: Course[] = [];
  featuredCourses: Course[] = [];
  selectedCourse: Course | null = null;
  activeCategory = 'all';
  searchQuery = '';
  isLoggedIn: boolean = false; // Track login status
  isInstructor: boolean = false; // Track instructor role

  // Carousel properties
  carouselOffset = 0;
  cardWidth = 320;
  cardsVisible = 3;
  isCarouselAtEnd = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit() {
    this.loadCourses();
    this.setupUrlParams();
    this.setupAuth(); // Initialize authentication
  }

  setupAuth() {
    // Subscribe to user authentication state
    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user; // True if user is logged in
      this.isInstructor = user?.role === 'instructor'; // True if user is an instructor
    });
  }

  setupUrlParams() {
    this.route.queryParams.subscribe(params => {
      this.activeCategory = params['category'] || 'all';
      this.searchQuery = params['q'] || '';
      this.filterCourses();
    });
  }

  loadCourses() {
    // This will be replaced with actual API call
    this.courses = this.getDummyCourses();
    this.featuredCourses = this.courses.filter(course => course.featured);
    this.filterCourses();
  }

  filterCourses() {
    this.filteredCourses = this.courses.filter(course => {
      const matchesCategory = this.activeCategory === 'all' || course.level === this.activeCategory;
      const matchesSearch = !this.searchQuery || 
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }

  openCourseModal(course: Course) {
    this.selectedCourse = course;
    document.body.style.overflow = 'hidden';
  }

  closeCourseModal() {
    this.selectedCourse = null;
    document.body.style.overflow = 'auto';
  }

  scrollCarousel(direction: 'prev' | 'next') {
    const maxOffset = -(this.featuredCourses.length - this.cardsVisible) * this.cardWidth;
    
    if (direction === 'prev') {
      this.carouselOffset = Math.min(this.carouselOffset + this.cardWidth, 0);
    } else {
      this.carouselOffset = Math.max(this.carouselOffset - this.cardWidth, maxOffset);
    }
    
    this.isCarouselAtEnd = this.carouselOffset <= maxOffset;
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  // Dummy data - replace with actual API call
  getDummyCourses(): Course[] {
    return [
      {
        id: '1',
        title: 'Complete Web Development Bootcamp',
        category: 'Web Development',
        description: 'Learn full-stack web development from scratch with hands-on projects',
        fullDescription: 'This comprehensive course covers everything you need to know about web development. From HTML and CSS basics to advanced JavaScript frameworks like React and Node.js. You\'ll build real-world projects and gain the skills needed to become a professional web developer.',
        level: 'beginner',
        duration: '4-6 months',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=250&fit=crop',
        instructor: {
          name: 'Sarah Johnson',
          profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616c4819abc?w=50&h=50&fit=crop&crop=face',
          bio: 'Senior Full Stack Developer with 8+ years of experience'
        },
        learners: 1247,
        rating: 4.8,
        reviewsCount: 234,
        featured: true,
        curriculum: [
          'HTML5 and CSS3 fundamentals',
          'JavaScript ES6+ features',
          'React.js and Redux',
          'Node.js and Express',
          'Database design with MongoDB',
          'Deployment and DevOps'
        ],
        reviews: [
          {
            studentName: 'Michael Chen',
            studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            rating: 5,
            comment: 'Excellent course! Sarah explains complex concepts in a very clear way.',
            date: new Date('2024-01-15')
          },
          {
            studentName: 'Emily Rodriguez',
            studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
            rating: 4,
            comment: 'Great practical examples and projects. Really helped me understand web development.',
            date: new Date('2024-01-10')
          }
        ]
      },
      {
        id: '2',
        title: 'Advanced React Development',
        category: 'Frontend',
        description: 'Master advanced React patterns and build scalable applications',
        fullDescription: 'Take your React skills to the next level with advanced patterns, performance optimization, and modern development practices. Learn hooks, context API, testing, and more.',
        level: 'advanced',
        duration: '2-3 months',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
        instructor: {
          name: 'David Kim',
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
          bio: 'React Core Team Member and Frontend Architect'
        },
        learners: 892,
        rating: 4.9,
        reviewsCount: 156,
        featured: true,
        curriculum: [
          'Advanced React Hooks',
          'Performance optimization',
          'State management patterns',
          'Testing strategies',
          'SSR and Next.js'
        ],
        reviews: [
          {
            studentName: 'Alex Thompson',
            studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
            rating: 5,
            comment: 'David\'s expertise really shows. Learned so much about React internals.',
            date: new Date('2024-01-20')
          }
        ]
      },
      {
        id: '3',
        title: 'Python for Data Science',
        category: 'Data Science',
        description: 'Learn Python programming for data analysis and machine learning',
        fullDescription: 'Comprehensive Python course focused on data science applications. Learn pandas, numpy, matplotlib, and scikit-learn through real-world projects.',
        level: 'intermediate',
        duration: '3-4 months',
        price: 99.99,
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
        instructor: {
          name: 'Dr. Maria Garcia',
          profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=50&h=50&fit=crop&crop=face',
          bio: 'Data Scientist and Machine Learning Researcher'
        },
        learners: 2156,
        rating: 4.7,
        reviewsCount: 423,
        featured: true,
        curriculum: [
          'Python fundamentals',
          'NumPy and Pandas',
          'Data visualization',
          'Machine learning basics',
          'Real-world projects'
        ],
        reviews: [
          {
            studentName: 'Jennifer Liu',
            studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
            rating: 5,
            comment: 'Perfect introduction to data science. The projects were very practical.',
            date: new Date('2024-01-12')
          }
        ]
      },
      {
        id: '4',
        title: 'Mobile App Development with Flutter',
        category: 'Mobile Development',
        description: 'Build cross-platform mobile apps with Flutter and Dart',
        level: 'intermediate',
        duration: '3-5 months',
        price: 109.99,
        image: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=400&h=250&fit=crop',
        instructor: {
          name: 'James Wilson',
          profilePicture: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=50&h=50&fit=crop&crop=face',
          bio: 'Senior Mobile Developer and Flutter Expert'
        },
        learners: 634,
        rating: 4.6,
        reviewsCount: 89,
        curriculum: [
          'Flutter basics',
          'Dart programming',
          'UI/UX design',
          'State management',
          'App deployment'
        ]
      },
      {
        id: '5',
        title: 'Introduction to Programming',
        category: 'Programming',
        description: 'Perfect first course for complete beginners to programming',
        level: 'beginner',
        duration: '2-3 months',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
        instructor: {
          name: 'Lisa Brown',
          profilePicture: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=50&h=50&fit=crop&crop=face',
          bio: 'Computer Science Education Specialist'
        },
        learners: 3421,
        rating: 4.8,
        reviewsCount: 567,
        curriculum: [
          'Programming concepts',
          'Problem solving',
          'Basic algorithms',
          'Code structure',
          'Project building'
        ]
      }
    ];
  }
}