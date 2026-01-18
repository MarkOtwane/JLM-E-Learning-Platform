import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-description">Manage your account preferences and notifications</p>
      </div>

      <!-- Settings Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar Navigation -->
        <div class="lg:col-span-1">
          <nav class="space-y-1">
            <button *ngFor="let section of sections"
                    (click)="activeSection = section.id"
                    [class.bg-primary-50]="activeSection === section.id"
                    [class.text-primary-700]="activeSection === section.id"
                    [class.font-semibold]="activeSection === section.id"
                    class="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              {{ section.label }}
            </button>
          </nav>
        </div>

        <!-- Settings Content -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Account Settings -->
          <div *ngIf="activeSection === 'account'" class="card">
            <div class="card-body space-y-6">
              <h3 class="text-lg font-bold text-gray-900">Account Settings</h3>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" value="student@example.com" class="input">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                <button class="btn-outline text-sm">Update Password</button>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <button class="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>

          <!-- Notifications -->
          <div *ngIf="activeSection === 'notifications'" class="card">
            <div class="card-body space-y-6">
              <h3 class="text-lg font-bold text-gray-900">Notification Preferences</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900">Email Notifications</h4>
                    <p class="text-sm text-gray-600">Receive email updates about your courses</p>
                  </div>
                  <input type="checkbox" checked class="w-5 h-5 text-primary-600 rounded">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900">Assignment Reminders</h4>
                    <p class="text-sm text-gray-600">Get notified about upcoming deadlines</p>
                  </div>
                  <input type="checkbox" checked class="w-5 h-5 text-primary-600 rounded">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900">Live Class Alerts</h4>
                    <p class="text-sm text-gray-600">Notifications for upcoming live sessions</p>
                  </div>
                  <input type="checkbox" checked class="w-5 h-5 text-primary-600 rounded">
                </div>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <button class="btn-primary">Save Preferences</button>
              </div>
            </div>
          </div>

          <!-- Privacy -->
          <div *ngIf="activeSection === 'privacy'" class="card">
            <div class="card-body space-y-6">
              <h3 class="text-lg font-bold text-gray-900">Privacy Settings</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900">Profile Visibility</h4>
                    <p class="text-sm text-gray-600">Make your profile visible to other students</p>
                  </div>
                  <input type="checkbox" class="w-5 h-5 text-primary-600 rounded">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900">Show Learning Progress</h4>
                    <p class="text-sm text-gray-600">Display your course completion on profile</p>
                  </div>
                  <input type="checkbox" checked class="w-5 h-5 text-primary-600 rounded">
                </div>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <button class="btn-primary">Save Settings</button>
              </div>
            </div>
          </div>

          <!-- Appearance -->
          <div *ngIf="activeSection === 'appearance'" class="card">
            <div class="card-body space-y-6">
              <h3 class="text-lg font-bold text-gray-900">Appearance</h3>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                <div class="grid grid-cols-2 gap-4">
                  <button class="p-4 border-2 border-primary-600 rounded-lg text-left">
                    <div class="font-medium mb-1">Light</div>
                    <div class="text-sm text-gray-600">Classic light theme</div>
                  </button>
                  <button class="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-gray-300">
                    <div class="font-medium mb-1">Dark</div>
                    <div class="text-sm text-gray-600">Easy on the eyes</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SettingsComponent {
  activeSection = 'account';

  sections = [
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'appearance', label: 'Appearance' }
  ];
}
