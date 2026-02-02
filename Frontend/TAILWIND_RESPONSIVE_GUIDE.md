# Tailwind CSS Responsive Design Guide

## Overview

This project uses **Tailwind CSS v4** for responsive, utility-first styling. Tailwind is already fully configured and ready to use.

## Configuration Files

- `tailwind.config.ts` - Main Tailwind configuration with custom theme extensions
- `postcss.config.js` - PostCSS plugins including Tailwind
- `src/styles.css` - Global styles with Tailwind imports

## Responsive Breakpoints

Tailwind uses mobile-first breakpoints. Use prefixes to apply styles at different screen sizes:

| Breakpoint | CSS                          | Min-width |
| ---------- | ---------------------------- | --------- |
| `sm`       | `@media (min-width: 640px)`  | 640px     |
| `md`       | `@media (min-width: 768px)`  | 768px     |
| `lg`       | `@media (min-width: 1024px)` | 1024px    |
| `xl`       | `@media (min-width: 1280px)` | 1280px    |
| `2xl`      | `@media (min-width: 1536px)` | 1536px    |

**Mobile-first approach**: Style for mobile first, then add `md:`, `lg:`, etc. for larger screens.

## Usage Examples

### Responsive Grid

```html
<!-- 1 column on mobile, 2 on tablet, 3 on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Responsive Padding

```html
<!-- Small padding on mobile, larger on desktop -->
<div class="px-4 md:px-8 lg:px-16">Content with responsive padding</div>
```

### Responsive Text

```html
<!-- Small text on mobile, larger on desktop -->
<h1 class="text-2xl md:text-3xl lg:text-5xl font-bold">Responsive Heading</h1>
```

### Responsive Flex

```html
<!-- Stack on mobile, row on tablet and above -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>
```

### Responsive Display

```html
<!-- Hide on mobile, show on desktop -->
<div class="hidden md:block">Desktop navigation menu</div>

<!-- Show on mobile, hide on desktop -->
<button class="md:hidden">Mobile menu toggle</button>
```

### Responsive Navigation Example

```html
<nav class="flex flex-col md:flex-row items-center justify-between p-4 md:p-6">
  <div class="text-xl md:text-2xl font-bold">Logo</div>

  <ul class="hidden md:flex gap-4 md:gap-8">
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Services</a></li>
  </ul>

  <button class="md:hidden">Menu</button>
</nav>
```

## Common Responsive Utilities

### Width & Height

```html
<div class="w-full md:w-1/2 lg:w-1/3">Responsive width</div>
<div class="h-40 md:h-60 lg:h-80">Responsive height</div>
```

### Margins & Padding

```html
<div class="mx-4 md:mx-8 lg:mx-16">Horizontal margin</div>
<div class="p-2 md:p-4 lg:p-8">Responsive padding</div>
```

### Font Sizes

```html
<p class="text-sm md:text-base lg:text-lg">Responsive text</p>
<h2 class="text-xl md:text-2xl lg:text-3xl">Responsive heading</h2>
```

### Grid Columns

```html
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <!-- Cards -->
</div>
```

## Tailwind Prefixes

### Responsive (shown above)

`sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Hover, Focus, Active

```html
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">Interactive Button</button>
```

### Dark Mode (if needed)

```html
<div class="bg-white dark:bg-gray-900">Light/dark theme</div>
```

## Best Practices

1. **Mobile-First**: Always design for mobile first, then enhance for larger screens
2. **Use Utility Classes**: Prefer Tailwind utilities over custom CSS
3. **Compose Components**: Create reusable component classes with @layer
4. **Avoid Arbitrary Values**: Use the configured theme when possible
5. **Group Related Classes**: Organize responsive prefixes together

## Example: Complete Responsive Component

```html
<!-- Responsive Hero Section -->
<section class="px-4 md:px-8 lg:px-16 py-8 md:py-12 lg:py-16">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">Welcome</h1>

    <p class="text-base md:text-lg lg:text-xl mb-6 md:mb-8">Responsive description text</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div class="p-4 md:p-6 bg-gray-100 rounded-lg">Card 1</div>
      <div class="p-4 md:p-6 bg-gray-100 rounded-lg">Card 2</div>
      <div class="p-4 md:p-6 bg-gray-100 rounded-lg">Card 3</div>
    </div>
  </div>
</section>
```

## Documentation

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Responsive Design Guide](https://tailwindcss.com/docs/responsive-design)
- [Breakpoints Reference](https://tailwindcss.com/docs/breakpoints)

## Next Steps

1. Update existing components to use Tailwind responsive classes
2. Replace custom CSS with Tailwind utilities
3. Test on different screen sizes (mobile, tablet, desktop)
4. Use browser DevTools to verify responsive behavior
