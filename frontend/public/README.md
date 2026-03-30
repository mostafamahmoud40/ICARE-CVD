# Public Assets Organization

This directory contains all static assets served directly by the web server with organized structure for maintainability.

## Directory Structure

```
public/
├── images/                    # All images used in the application
│   ├── logo/                 # Brand logos and variations
│   ├── avatars/              # User profile pictures and default avatars
│   ├── illustrations/        # Empty states & onboarding illustrations
│   ├── icons/                # Custom SVG icons
│   └── og/                   # Social preview images (Open Graph/Twitter)
├── icons/                     # PWA + browser icons (favicons, app icons)
├── fonts/                     # Self-hosted fonts (.woff, .woff2, .ttf)
├── manifest.json              # PWA manifest for mobile app installation
├── robots.txt                 # Search engine crawling instructions
└── README.md                  # This documentation
```

## Usage Guidelines

### Images Directory
- **Logo**: Brand assets in various formats (SVG preferred)
- **Avatars**: Default user images, placeholder avatars
- **Illustrations**: Onboarding flows, empty states, error pages
- **Icons**: Custom SVG icons for UI elements
- **OG**: Social sharing preview images (1200x630px recommended)

### Icons Directory
- PWA app icons for various device sizes
- Favicon files (.ico, .png)
- Apple touch icons for iOS
- Android launcher icons

### Fonts Directory
- Self-hosted web fonts for performance
- Include multiple formats for browser compatibility
- Consider font loading strategies

### SEO & PWA Files
- **manifest.json**: Configure PWA behavior and appearance
- **robots.txt**: Control search engine indexing

## Best Practices

1. **Optimize images** before placing in directories
2. **Use descriptive filenames** (no spaces, use hyphens)
3. **Include multiple formats** when needed (WebP, PNG, SVG)
4. **Consider accessibility** with alt text planning
5. **Update manifest.json** with actual app details
6. **Review robots.txt** for production deployment

## File Naming Conventions

- Use lowercase letters
- Separate words with hyphens
- Include size in filename when relevant: `logo-128x128.png`
- Use semantic names: `empty-state-appointments.svg`