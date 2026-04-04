# Requirements Document: Typography & Font System Overhaul

## Introduction

This feature transforms the SafeGuard Enterprise UI typography system from bold, heavy fonts to ultra-thin, refined typography with reflective gradient shading on statistics. This is Phase 4 of a 4-phase enterprise UI overhaul, inspired by modern enterprise applications like Google AI Studio. The typography overhaul includes replacing the font library, implementing a new weight system, and adding reflective shading effects to numeric statistics to enhance visual hierarchy and enterprise aesthetic.

## Glossary

- **Typography_System**: The complete set of font families, weights, sizes, line heights, and letter-spacing values used throughout the application
- **Font_Library**: The collection of font files loaded from external sources (Google Fonts) that provide the typeface families
- **Font_Weight**: The thickness or boldness of a font, measured numerically (200=thin, 300=light, 400=normal, 500=medium, 600=semibold, 700=bold)
- **Reflective_Shading**: A visual effect combining gradient text fills and layered text shadows to create a glossy, dimensional appearance on text
- **StatValue_Component**: A reusable React component that renders numeric statistics with reflective gradient shading
- **Letter_Spacing**: The horizontal space between characters in text, also called tracking
- **Font_Smoothing**: Browser rendering technique that applies anti-aliasing to improve the appearance of thin fonts
- **WCAG_AA**: Web Content Accessibility Guidelines Level AA, requiring 4.5:1 contrast ratio for normal text and 3:1 for large text
- **Gradient_Text**: Text rendered with a gradient color fill using CSS background-clip technique
- **Text_Shadow**: CSS property that creates shadow effects behind text for depth and readability
- **Inter_Font**: A sans-serif typeface family designed for user interfaces, supporting weights 100-900
- **Plus_Jakarta_Sans**: The current heading font family being replaced in this overhaul
- **MetricCard_Component**: An existing React component that displays key metrics and statistics
- **Component_Library**: The collection of all React components in src/components directory
- **Typography_Scale**: The hierarchical system of font sizes for headings (h1-h6) and body text
- **Shimmer_Effect**: An animated highlight that moves across text on hover to create a reflective appearance

## Requirements

### Requirement 1: Font Library Replacement

**User Story:** As a developer, I want to replace the current font library with Inter font weights 200-600, so that the application uses ultra-thin, refined typography suitable for enterprise interfaces.

#### Acceptance Criteria

1. THE Typography_System SHALL load Inter_Font with weights 200, 300, 400, 500, and 600 from Google Fonts
2. THE Typography_System SHALL remove Plus_Jakarta_Sans font references from the Font_Library
3. THE Typography_System SHALL apply font preconnect hints to fonts.googleapis.com for performance optimization
4. THE Typography_System SHALL set Inter_Font as the primary font family for all text elements
5. THE Typography_System SHALL apply font-display swap strategy to prevent invisible text during font loading

### Requirement 2: Typography Scale Definition

**User Story:** As a designer, I want a new typography scale with thin font weights and negative letter-spacing, so that headings appear refined and modern.

#### Acceptance Criteria

1. THE Typography_System SHALL define h1 headings as 48px size with Font_Weight 200 and Letter_Spacing -0.03em
2. THE Typography_System SHALL define h2 headings as 36px size with Font_Weight 200 and Letter_Spacing -0.025em
3. THE Typography_System SHALL define h3 headings as 28px size with Font_Weight 300 and Letter_Spacing -0.02em
4. THE Typography_System SHALL define h4 headings as 24px size with Font_Weight 300 and Letter_Spacing -0.015em
5. THE Typography_System SHALL define h5 headings as 20px size with Font_Weight 400 and Letter_Spacing -0.01em
6. THE Typography_System SHALL define h6 headings as 18px size with Font_Weight 400 and Letter_Spacing -0.01em
7. THE Typography_System SHALL define body text as 15px size with Font_Weight 300 and Letter_Spacing -0.005em
8. THE Typography_System SHALL apply Font_Smoothing antialiased rendering to all text elements

### Requirement 3: Component Font Weight Migration

**User Story:** As a developer, I want all components updated to use thin font weights, so that the entire application reflects the new typography system consistently.

#### Acceptance Criteria

1. THE Component_Library SHALL replace all font-semibold classes with font-light or font-normal classes
2. THE Component_Library SHALL replace all font-bold classes with font-normal or font-medium classes
3. THE Component_Library SHALL update Sidebar navigation text to use Font_Weight 300
4. THE Component_Library SHALL update TabNavigation labels to use Font_Weight 400
5. THE Component_Library SHALL update all heading elements in card components to use the new Typography_Scale weights
6. THE Component_Library SHALL maintain consistent Font_Weight usage across all 30+ component files

### Requirement 4: Accessibility Compliance

**User Story:** As a user with visual impairments, I want thin fonts to maintain sufficient contrast, so that I can read all text content clearly.

#### Acceptance Criteria

1. THE Typography_System SHALL ensure all body text meets WCAG_AA contrast ratio of 4.5:1 against background colors
2. THE Typography_System SHALL ensure all large text (18px+) meets WCAG_AA contrast ratio of 3.1:1 against background colors
3. THE Typography_System SHALL remain readable when browser zoom is set to 200 percent
4. THE Typography_System SHALL apply Font_Smoothing to improve thin font rendering on all platforms
5. WHEN a user enables high contrast mode, THE Typography_System SHALL increase Font_Weight by one level (200→300, 300→400)

### Requirement 5: StatValue Component Creation

**User Story:** As a developer, I want a reusable StatValue component with reflective shading, so that I can consistently display numeric statistics with visual polish.

#### Acceptance Criteria

1. THE StatValue_Component SHALL accept value, color, size, and reflective properties as inputs
2. THE StatValue_Component SHALL render numeric values with Gradient_Text using background-clip technique
3. THE StatValue_Component SHALL apply layered Text_Shadow effects to create depth and reflection
4. THE StatValue_Component SHALL support color variants: primary (cyan), success (green), warning (amber), danger (red), and neutral (gray)
5. THE StatValue_Component SHALL support size variants: small, medium, and large
6. THE StatValue_Component SHALL provide a reflective toggle to enable or disable Reflective_Shading
7. THE StatValue_Component SHALL integrate with the existing useAnimatedCounter hook for animated number transitions

### Requirement 6: Color-Specific Gradient Definitions

**User Story:** As a designer, I want color-specific gradients for different statistic types, so that visual hierarchy and meaning are reinforced through color.

#### Acceptance Criteria

1. THE Typography_System SHALL define primary gradient as linear-gradient from #06b6d4 to #0e7490 for cyan statistics
2. THE Typography_System SHALL define success gradient as linear-gradient from #10b981 to #047857 for green statistics
3. THE Typography_System SHALL define warning gradient as linear-gradient from #f59e0b to #b45309 for amber statistics
4. THE Typography_System SHALL define danger gradient as linear-gradient from #ef4444 to #b91c1c for red statistics
5. THE Typography_System SHALL define neutral gradient as linear-gradient from #f1f5f9 to #94a3b8 for gray statistics
6. THE Typography_System SHALL apply corresponding Text_Shadow colors that match each gradient variant

### Requirement 7: Reflective Shading Implementation

**User Story:** As a user, I want statistics to have reflective gradient shading, so that important numbers stand out with visual depth and polish.

#### Acceptance Criteria

1. WHEN a statistic is rendered, THE StatValue_Component SHALL apply Gradient_Text with webkit-background-clip and webkit-text-fill-color transparent
2. WHEN a statistic is rendered, THE StatValue_Component SHALL apply three-layer Text_Shadow with highlight, depth, and reflection shadows
3. THE StatValue_Component SHALL apply a top highlight shadow at 0px 1px with 40 percent white opacity
4. THE StatValue_Component SHALL apply a depth shadow at 0px 2px 4px with 30 percent black opacity
5. THE StatValue_Component SHALL apply a reflection shadow at 0px -1px with 20 percent black opacity
6. THE StatValue_Component SHALL combine Gradient_Text and Text_Shadow techniques for maximum visual impact

### Requirement 8: Hover Shimmer Animation

**User Story:** As a user, I want statistics to shimmer on hover, so that interactive elements provide visual feedback.

#### Acceptance Criteria

1. WHEN a user hovers over a statistic, THE StatValue_Component SHALL trigger a Shimmer_Effect animation
2. THE Shimmer_Effect SHALL move a highlight gradient across the text from left to right
3. THE Shimmer_Effect SHALL complete its animation within 600 milliseconds
4. THE Shimmer_Effect SHALL use cubic-bezier easing for smooth acceleration and deceleration
5. WHEN a user stops hovering, THE StatValue_Component SHALL return to the default Reflective_Shading state within 300 milliseconds

### Requirement 9: MetricCard Integration

**User Story:** As a developer, I want MetricCard components to use StatValue for numeric displays, so that all metrics have consistent reflective shading.

#### Acceptance Criteria

1. THE MetricCard_Component SHALL replace plain text value rendering with StatValue_Component
2. THE MetricCard_Component SHALL pass appropriate color props to StatValue_Component based on metric type
3. THE MetricCard_Component SHALL maintain compatibility with existing animated counter functionality
4. THE MetricCard_Component SHALL preserve all existing layout and spacing properties
5. WHEN MetricCard receives a numeric value, THE MetricCard_Component SHALL render it using StatValue_Component with reflective property enabled

### Requirement 10: Application-Wide Statistics Update

**User Story:** As a user, I want all numeric statistics throughout the application to have reflective shading, so that the visual treatment is consistent.

#### Acceptance Criteria

1. THE Component_Library SHALL apply StatValue_Component to financial metrics in FinancialOverview component
2. THE Component_Library SHALL apply StatValue_Component to protection score in ActionPlan component
3. THE Component_Library SHALL apply StatValue_Component to account balances in AccountBalances component
4. THE Component_Library SHALL apply StatValue_Component to all numeric values in card components displaying statistics
5. THE Component_Library SHALL maintain existing data formatting (currency, percentages, decimals) when using StatValue_Component

### Requirement 11: CSS Utility Classes

**User Story:** As a developer, I want CSS utility classes for reflective text, so that I can quickly apply reflective shading without creating component instances.

#### Acceptance Criteria

1. THE Typography_System SHALL provide text-reflective-primary utility class for cyan Reflective_Shading
2. THE Typography_System SHALL provide text-reflective-success utility class for green Reflective_Shading
3. THE Typography_System SHALL provide text-reflective-warning utility class for amber Reflective_Shading
4. THE Typography_System SHALL provide text-reflective-danger utility class for red Reflective_Shading
5. THE Typography_System SHALL provide text-reflective-neutral utility class for gray Reflective_Shading
6. THE Typography_System SHALL include both Gradient_Text and Text_Shadow definitions in each utility class

### Requirement 12: Performance Optimization

**User Story:** As a user, I want typography changes to render smoothly, so that the application maintains 60fps performance.

#### Acceptance Criteria

1. THE Typography_System SHALL use CSS transforms and opacity for all animations to enable GPU acceleration
2. THE StatValue_Component SHALL avoid layout recalculation during Shimmer_Effect animations
3. THE Typography_System SHALL limit Text_Shadow layers to three or fewer to minimize rendering cost
4. THE Typography_System SHALL use will-change CSS property on animated text elements
5. WHEN rendering 20 or more StatValue_Component instances simultaneously, THE Typography_System SHALL maintain 60fps frame rate

### Requirement 13: Browser Compatibility

**User Story:** As a user on different browsers, I want typography to render consistently, so that the experience is uniform across platforms.

#### Acceptance Criteria

1. THE Typography_System SHALL render Gradient_Text correctly in Chrome, Firefox, Safari, and Edge browsers
2. THE Typography_System SHALL provide -webkit-background-clip fallback for Gradient_Text
3. THE Typography_System SHALL apply Font_Smoothing with both -webkit and -moz vendor prefixes
4. THE Typography_System SHALL test Text_Shadow rendering on Windows, macOS, and Linux platforms
5. WHEN a browser does not support background-clip text, THE Typography_System SHALL fall back to solid color text with Text_Shadow only

### Requirement 14: Responsive Typography

**User Story:** As a mobile user, I want typography to scale appropriately, so that text remains readable on smaller screens.

#### Acceptance Criteria

1. WHEN viewport width is below 1024px, THE Typography_System SHALL reduce h1 size from 48px to 40px
2. WHEN viewport width is below 1024px, THE Typography_System SHALL reduce h2 size from 36px to 32px
3. WHEN viewport width is below 768px, THE Typography_System SHALL reduce h1 size from 40px to 32px
4. WHEN viewport width is below 768px, THE Typography_System SHALL increase Font_Weight by one level for improved mobile readability
5. THE Typography_System SHALL maintain Letter_Spacing ratios across all breakpoints

### Requirement 15: Configuration File Management

**User Story:** As a developer, I want font configuration centralized, so that typography changes can be made in one location.

#### Acceptance Criteria

1. THE Typography_System SHALL define all font families in CSS custom properties in src/index.css
2. THE Typography_System SHALL define all Font_Weight values in CSS custom properties
3. THE Typography_System SHALL define all Typography_Scale sizes in CSS custom properties
4. THE Typography_System SHALL define all gradient definitions in CSS custom properties
5. THE Typography_System SHALL allow components to reference typography values through CSS variables only

## Implementation Notes

This requirements document defines the complete typography overhaul for Phase 4 of the enterprise UI transformation. The implementation will occur in two sprints:

- Sprint 4.1 focuses on Requirements 1-4 and 15 (font library, typography scale, component migration, accessibility)
- Sprint 4.2 focuses on Requirements 5-14 (StatValue component, reflective shading, animations, integration)

All requirements follow EARS patterns and INCOSE quality rules for clarity, testability, and completeness.
