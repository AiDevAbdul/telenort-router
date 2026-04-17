# WMK Auto Garage - UI/UX Redesign Visual Reference Guide

## Component Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     EnhancedHeader                           │
│  Logo | Nav Items | CTA Button | Mobile Menu                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Page Content                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Hero Section (Animated Grid + Gradient Overlay)     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Main Content (Cards, Forms, Grids)                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ CTA Section (Buttons, Forms)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     EnhancedFooter                           │
│  Company | Services | Brands | Company | Contact            │
│  Newsletter | Social | Trust Badges | Floating CTA          │
└─────────────────────────────────────────────────────────────┘
```

---

## Page Structure Comparison

### Services Page

**Before**:
```
Hero (Basic)
├─ Title
├─ Subtitle
└─ Grid (12 cards, flat design)
```

**After**:
```
Hero (Premium)
├─ Animated Grid Background
├─ Gradient Overlay
├─ Badge
├─ Title + Gradient Accent
├─ Subheading + Stats
└─ Quick Stats Row

Category Filters
├─ All (active)
├─ Programming
├─ Repair
└─ Maintenance

Services Grid (Enhanced)
├─ Card 1 (Glow, Shine, Hover Effects)
├─ Card 2 (Multi-layer Background)
├─ Card 3 (Border Animation)
└─ ... (12 total)

Why Choose Section
├─ 4 Benefit Cards (Hover Effects)
└─ CTA Buttons

CTA Section
├─ Heading
├─ Subheading
└─ Dual CTAs (Call + WhatsApp)
```

### Contact Page

**Before**:
```
Hero (Basic)
├─ Title
└─ Subtitle

Contact Info (4 cards, flat)
├─ Phone
├─ Location
├─ Hours
└─ WhatsApp

Form + Map (2 columns)
├─ Form (basic inputs)
└─ Map + Hours
```

**After**:
```
Hero (Premium)
├─ Animated Grid Background
├─ Badge
├─ Title + Gradient Accent
├─ Subheading + Trust Signal
└─ Response Time Badge

Contact Info (Enhanced)
├─ Phone (Hover: Scale, Glow)
├─ Location (Hover: Scale, Glow)
├─ Hours (Hover: Scale, Glow)
└─ WhatsApp (Hover: Scale, Glow)

Form Section (Left)
├─ Form Title + Subtitle
├─ Name Input (Validation)
├─ Phone Input (Validation)
├─ Brand Select
├─ Service Select (Required)
├─ Message Textarea
└─ Submit Button (States: Idle, Submitting, Success)

Right Column
├─ Embedded Map (Styled)
├─ Business Hours Card (Trust Signals)
│  ├─ RTA Licensed
│  ├─ 10+ Years Experience
│  └─ Workmanship Guaranteed
└─ FAQ Accordion (4 FAQs)

CTA Banner
├─ Heading
├─ Subheading
└─ Dual CTAs
```

---

## Animation Patterns

### Page Load Sequence
```
Timeline (ms):
0ms    ├─ Hero content fades in + slides up
300ms  ├─ Background elements fade in
600ms  ├─ Section heading appears
900ms  ├─ Cards stagger in (0.1s delay each)
1200ms ├─ CTA buttons appear
1500ms └─ All animations complete
```

### Card Hover Sequence
```
On Hover:
├─ Border: primary/20 → primary/60 (0.3s)
├─ Background: transparent → primary/8 (0.3s)
├─ Shadow: primary/0 → primary/40 (0.3s)
├─ Icon: scale 1 → 1.25 (0.3s)
├─ Icon: rotate 0 → 5deg (0.3s)
├─ Title: white → primary (0.3s)
└─ Shine: translateX -100% → 100% (0.7s)
```

### Form Validation Sequence
```
On Input:
├─ Border: steel-light/30 → primary (0.3s)
├─ Error: border → accent-red (0.3s)
├─ Success: border → primary + checkmark (0.3s)
└─ Message: fade in (0.2s)
```

---

## Color Application Guide

### Hero Sections
```
Background: Steel Dark (#1E2128)
Grid Overlay: Primary (#F5C518) @ 15% opacity
Gradient Overlay: Steel Dark → Steel Mid
Accent Glow: Primary @ 8% opacity
Text: White
Accent Text: Primary (gradient)
```

### Cards
```
Background: Steel Mid (#4E5566) @ 60%
Hover Background: Steel Mid @ 80%
Border: Primary @ 20%
Hover Border: Primary @ 60%
Shadow: Primary @ 0-40%
Text: White
Secondary Text: Steel Light @ 80-90%
```

### Buttons
```
Primary Button:
├─ Background: Primary → Primary/90 (gradient)
├─ Text: Steel Dark
├─ Hover Shadow: Primary @ 50%
└─ Shine: White @ 20%

Secondary Button:
├─ Background: White @ 10%
├─ Border: White @ 20%
├─ Text: White
└─ Hover: White @ 20%, Border @ 40%
```

---

## Typography Hierarchy

### Page Hierarchy
```
H1 (Hero Title)
├─ Font: Barlow Condensed 700
├─ Size: 5xl (mobile) → 7xl (desktop)
├─ Tracking: tight
└─ Color: White + Gradient accent

H2 (Section Title)
├─ Font: Exo 2 600
├─ Size: 4xl (mobile) → 5xl (desktop)
├─ Tracking: tight
└─ Color: White + Gradient accent

H3 (Card Title)
├─ Font: IBM Plex Sans 600
├─ Size: xl → 2xl
├─ Tracking: tight
└─ Color: White → Primary (hover)

Body Text
├─ Font: IBM Plex Sans 400/500
├─ Size: base → lg
├─ Line Height: relaxed (1.625)
└─ Color: Steel Light @ 80-90%

Label Text
├─ Font: IBM Plex Sans 500
├─ Size: sm
├─ Tracking: tight
└─ Color: White
```

---

## Responsive Breakpoints

### Mobile (320px - 640px)
```
Header:
├─ Logo: Visible
├─ Nav: Hidden (hamburger menu)
└─ CTA: Hidden

Hero:
├─ Title: 5xl
├─ Subheading: base
└─ Stats: Single column

Cards:
├─ Grid: 1 column
├─ Padding: 6 (24px)
└─ Gap: 6 (24px)

Forms:
├─ Layout: Single column
├─ Input Height: py-3 (12px padding)
└─ CTA: Full width
```

### Tablet (641px - 1024px)
```
Header:
├─ Logo: Visible
├─ Nav: Visible (partial)
└─ CTA: Visible

Hero:
├─ Title: 6xl
├─ Subheading: lg
└─ Stats: 2-3 columns

Cards:
├─ Grid: 2 columns
├─ Padding: 8 (32px)
└─ Gap: 8 (32px)

Forms:
├─ Layout: 2 columns (form + map)
├─ Input Height: py-3
└─ CTA: Auto width
```

### Desktop (1025px+)
```
Header:
├─ Logo: Visible
├─ Nav: Full visible
└─ CTA: Visible

Hero:
├─ Title: 7xl
├─ Subheading: lg
└─ Stats: 3 columns

Cards:
├─ Grid: 3-4 columns
├─ Padding: 8 (32px)
└─ Gap: 8 (32px)

Forms:
├─ Layout: 2 columns (form + map)
├─ Input Height: py-3
└─ CTA: Auto width
```

---

## Interaction States

### Button States
```
Idle:
├─ Background: Primary → Primary/90
├─ Shadow: primary/50
├─ Scale: 1
└─ Opacity: 1

Hover:
├─ Background: Primary → Primary/90 (same)
├─ Shadow: primary/70
├─ Scale: 1.05
├─ Shine: Animate left → right
└─ Opacity: 1

Active/Pressed:
├─ Scale: 0.98
└─ Shadow: primary/30

Disabled:
├─ Opacity: 0.5
├─ Cursor: not-allowed
└─ Pointer Events: none
```

### Form Input States
```
Idle:
├─ Border: steel-light/30
├─ Background: steel-dark/50
└─ Text: White

Focus:
├─ Border: primary
├─ Background: steel-dark/50
├─ Box Shadow: 0 0 0 3px primary/10
└─ Text: White

Error:
├─ Border: accent-red
├─ Background: steel-dark/50
├─ Box Shadow: 0 0 0 3px accent-red/10
└─ Text: White

Success:
├─ Border: primary
├─ Background: steel-dark/50
├─ Checkmark: Visible
└─ Text: White
```

### Link States
```
Idle:
├─ Color: Steel Light/80
└─ Underline: None

Hover:
├─ Color: Primary
├─ Underline: Animate width 0 → 100%
└─ Transition: 0.3s

Active:
├─ Color: Primary
└─ Underline: 100%
```

---

## Spacing System

### Padding Scale
```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
```

### Margin Scale
```
Same as padding scale
```

### Gap Scale (Flex/Grid)
```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

### Section Spacing
```
Hero Section: py-20 (80px)
Content Section: py-24 (96px)
Subsection: py-12 (48px)
Component Gap: gap-6 to gap-8 (24-32px)
```

---

## Shadow System

### Subtle Shadow
```
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)
```

### Medium Shadow
```
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
```

### Large Shadow
```
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1)
```

### Glow Shadow (Primary)
```
box-shadow: 0 0 20px rgba(245, 197, 24, 0.3)
```

### Hover Glow Shadow
```
box-shadow: 0 20px 60px rgba(245, 197, 24, 0.3)
```

---

## Border Radius System

### Small
```
rounded-lg: 0.5rem (8px)
```

### Medium
```
rounded-xl: 0.75rem (12px)
```

### Large
```
rounded-2xl: 1rem (16px)
```

### Extra Large
```
rounded-3xl: 1.5rem (24px)
```

### Full
```
rounded-full: 9999px (circles)
```

---

## Animation Easing Functions

### Ease Out (Recommended for entrances)
```
cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Ease In Out (Recommended for transitions)
```
cubic-bezier(0.4, 0, 0.2, 1)
```

### Linear (Recommended for continuous)
```
linear
```

### Spring (Recommended for interactive)
```
Framer Motion: type: 'spring', stiffness: 300
```

---

## Performance Checklist

### Animations
- ✅ Use CSS animations where possible
- ✅ Use `will-change` for animated elements
- ✅ Limit simultaneous animations
- ✅ Use `transform` and `opacity` only
- ✅ Avoid animating `width`, `height`, `left`, `top`

### Images
- ✅ Use next/image component
- ✅ Set width and height
- ✅ Use `loading="lazy"` for below-fold
- ✅ Use `priority` for above-fold
- ✅ Optimize image sizes

### Code Splitting
- ✅ Use dynamic imports for heavy components
- ✅ Lazy load modals and overlays
- ✅ Code split by route

### Rendering
- ✅ Minimize re-renders
- ✅ Use React.memo for expensive components
- ✅ Use useCallback for event handlers
- ✅ Use useMemo for expensive calculations

---

## Accessibility Checklist

### Keyboard Navigation
- ✅ All interactive elements focusable
- ✅ Focus order logical
- ✅ Focus visible (outline or highlight)
- ✅ Escape key closes modals

### Screen Readers
- ✅ Semantic HTML (button, link, form)
- ✅ ARIA labels on icons
- ✅ ARIA live regions for dynamic content
- ✅ Form labels associated with inputs

### Color & Contrast
- ✅ Color not only means of communication
- ✅ Text contrast ≥ 4.5:1 (normal text)
- ✅ Text contrast ≥ 3:1 (large text)
- ✅ Focus indicators visible

### Motion
- ✅ Respect `prefers-reduced-motion`
- ✅ No auto-playing videos
- ✅ No flashing content (> 3 times/sec)

---

## Testing Scenarios

### Desktop Testing
```
✅ Chrome 120+
✅ Firefox 121+
✅ Safari 17+
✅ Edge 120+
```

### Mobile Testing
```
✅ iOS Safari 17+
✅ Chrome Mobile 120+
✅ Samsung Internet 20+
```

### Tablet Testing
```
✅ iPad Safari 17+
✅ iPad Chrome 120+
```

### Accessibility Testing
```
✅ Keyboard only navigation
✅ Screen reader (NVDA, JAWS, VoiceOver)
✅ Color contrast (WCAG AA)
✅ Reduced motion
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All components tested
- [ ] All animations smooth (60fps)
- [ ] All links working
- [ ] Forms validated
- [ ] Images optimized
- [ ] Performance metrics met
- [ ] Accessibility audit passed
- [ ] Cross-browser tested

### Deployment
- [ ] Backup current version
- [ ] Deploy to staging
- [ ] Final QA on staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Monitor analytics

### Post-Deployment
- [ ] Verify all pages load
- [ ] Check analytics tracking
- [ ] Monitor conversion metrics
- [ ] Gather user feedback
- [ ] Document any issues
- [ ] Plan next iteration

---

## Quick Reference Commands

### View Component
```bash
# Services page
cat app/[locale]/services/page-enhanced.tsx

# Contact page
cat app/[locale]/contact/page-enhanced.tsx

# Brands page
cat app/[locale]/brands/page-enhanced.tsx

# About page
cat app/[locale]/about/page-enhanced.tsx

# Header
cat components/ui/EnhancedHeader.tsx

# Footer
cat components/ui/EnhancedFooter.tsx
```

### Deploy Component
```bash
# Services
cp app/[locale]/services/page-enhanced.tsx app/[locale]/services/page.tsx

# Contact
cp app/[locale]/contact/page-enhanced.tsx app/[locale]/contact/page.tsx

# Brands
cp app/[locale]/brands/page-enhanced.tsx app/[locale]/brands/page.tsx

# About
cp app/[locale]/about/page-enhanced.tsx app/[locale]/about/page.tsx

# Header
cp components/ui/EnhancedHeader.tsx components/ui/Header.tsx

# Footer
cp components/ui/EnhancedFooter.tsx components/ui/Footer.tsx
```

---

## Support Resources

### Documentation
- WMK_REDESIGN_PLAN.md - Design specifications
- IMPLEMENTATION_GUIDE.md - Deployment guide
- REDESIGN_SUMMARY.md - Project summary

### Component Files
- EnhancedHeader.tsx - Navigation component
- EnhancedFooter.tsx - Footer component
- page-enhanced.tsx (Services, Contact, Brands, About)

### Design Tokens
- Colors: Primary, Steel Dark/Mid/Light, Accent Red
- Typography: Barlow Condensed, Exo 2, IBM Plex Sans, JetBrains Mono
- Spacing: xs-3xl scale
- Shadows: Subtle to Glow
- Radius: lg-full scale

---

**Last Updated**: April 7, 2026
**Status**: Ready for Production
**Version**: 1.0
