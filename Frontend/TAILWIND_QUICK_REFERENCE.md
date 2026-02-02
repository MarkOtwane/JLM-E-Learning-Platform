# Tailwind CSS Quick Reference Card

## 🎯 Essential Responsive Classes

### Breakpoints

```
sm:   640px    | md:   768px    | lg:   1024px   | xl:   1280px   | 2xl:  1536px
```

### Grid & Layout

```html
<!-- Responsive Grid -->
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

<!-- Responsive Flex -->
flex flex-col md:flex-row

<!-- Width -->
w-full md:w-1/2 lg:w-1/3

<!-- Hidden/Visible -->
hidden md:block
<!-- Hidden mobile, visible md+ -->
md:hidden
<!-- Visible mobile, hidden md+ -->
```

### Spacing

```html
<!-- Padding -->
p-4 md:p-6 lg:p-8 px-4 md:px-6 lg:px-8
<!-- horizontal -->
py-4 md:py-6 lg:py-8
<!-- vertical -->

<!-- Margin -->
m-4 md:m-6 lg:m-8 mx-auto
<!-- center -->

<!-- Gap -->
gap-4 md:gap-6 lg:gap-8
```

### Typography

```html
<!-- Size -->
text-sm md:text-base lg:text-lg text-2xl md:text-3xl lg:text-4xl

<!-- Weight -->
font-light font-normal font-bold font-extrabold

<!-- Alignment -->
text-left text-center text-right
```

### Colors

```html
<!-- Text -->
text-gray-600 text-blue-500 text-white

<!-- Background -->
bg-white bg-gray-100 bg-blue-600

<!-- Border -->
border border-gray-300 border-blue-500
```

### Buttons

```html
<!-- Primary Button -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Click</button>

<!-- Outline Button -->
<button class="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">Click</button>
```

### Forms

```html
<!-- Input -->
<input class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />

<!-- Label -->
<label class="block text-sm font-medium mb-2 text-gray-700"> Label </label>
```

### Cards

```html
<div class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg">Card content</div>
```

## 🎨 Common Responsive Patterns

### Full-Width Container

```html
<div class="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">Content</div>
```

### Two-Column Layout

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

### Three-Column Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Navigation Bar

```html
<nav class="flex flex-col md:flex-row justify-between items-center p-4 md:p-6">
  <div>Logo</div>
  <ul class="hidden md:flex gap-8">
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
  </ul>
</nav>
```

### Hero Section

```html
<section class="px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-24">
  <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Title</h1>
  <p class="text-lg md:text-xl mb-8">Description</p>
  <button class="px-6 py-3 bg-blue-600 text-white rounded-lg">CTA</button>
</section>
```

### Sidebar Layout

```html
<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <aside class="lg:col-span-1">Sidebar</aside>
  <main class="lg:col-span-3">Content</main>
</div>
```

## 🔧 Custom Helper Classes (Available)

```html
<!-- Container -->
<div class="container-responsive">Container</div>

<!-- Responsive Sections -->
<section class="section-padding">Content</section>
<section class="section-padding-sm">Content</section>
<section class="section-padding-lg">Content</section>

<!-- Responsive Grids -->
<div class="grid-responsive">3 cols desktop, 2 cols tablet, 1 col mobile</div>
<div class="grid-responsive-2">2 cols responsive</div>
<div class="grid-responsive-4">4 cols responsive</div>

<!-- Responsive Text -->
<h1 class="heading-responsive-lg">Large Heading</h1>
<h2 class="heading-responsive-md">Medium Heading</h2>
<p class="text-responsive">Body Text</p>

<!-- Responsive Flex -->
<div class="flex-responsive">Flex col mobile, row md+</div>

<!-- Show/Hide -->
<div class="hidden-mobile">Only on md+</div>
<div class="mobile-only">Only on mobile</div>
```

## ⚡ Commonly Used Size Values

```
Spacing (px → rem):
1 = 4px    | 2 = 8px    | 3 = 12px   | 4 = 16px
6 = 24px   | 8 = 32px   | 10 = 40px  | 12 = 48px

Width:
w-1/2 = 50%  | w-1/3 = 33%  | w-2/3 = 67%
w-full = 100% | w-screen = 100vw

Text Sizes:
text-xs = 12px   | text-sm = 14px    | text-base = 16px
text-lg = 18px   | text-xl = 20px    | text-2xl = 24px

Rounded:
rounded = 4px     | rounded-md = 6px      | rounded-lg = 8px
rounded-xl = 12px | rounded-2xl = 16px    | rounded-full = 9999px
```

## 🎯 Mobile-First Workflow

1. **Write mobile styles first (no prefix)**

   ```html
   <div class="text-sm px-4 py-2"></div>
   ```

2. **Add tablet styles (md: prefix)**

   ```html
   <div class="text-sm md:text-base md:px-6 md:py-3"></div>
   ```

3. **Add desktop styles (lg: prefix)**
   ```html
   <div class="text-sm md:text-base lg:text-lg md:px-6 lg:px-8 md:py-3 lg:py-4"></div>
   ```

## 📱 Quick Responsive Test

```html
<!-- Add to any element to see current breakpoint -->
<div class="breakpoint-debug">Displays: mobile | sm | md | lg | xl | 2xl (bottom-right corner)</div>
```

## 🚀 Pro Tips

1. **Avoid**: `style="width: 500px"` → **Use**: `w-96` or `max-w-md`
2. **Avoid**: Multiple media queries → **Use**: `md:px-6 lg:px-8`
3. **Avoid**: Hardcoded colors → **Use**: Color from theme
4. **Always**: Mobile first → **Then**: Add larger screen styles
5. **Test**: At breakpoints → **Check**: Looks good on all sizes

## 🔗 Useful Links

- [Tailwind Docs](https://tailwindcss.com/docs)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Spacing Scale](https://tailwindcss.com/docs/customizing-spacing)
- [Configuration](https://tailwindcss.com/docs/configuration)

---

**Print this card or bookmark for quick reference!**
