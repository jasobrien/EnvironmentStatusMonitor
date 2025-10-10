# Merged Dashboard Graph Implementation

## Overview
This document describes the changes made to merge the three separate environment dashboard charts into a single unified polar area chart.

## Changes Summary

### What Changed
1. **Dashboard Layout** (`pages/dashboard.html`)
   - Replaced three separate cards (Dev, Test, Staging) with one unified card
   - Chart occupies 2/3 of the width (left side)
   - Sidebar with uptime stats and performance links occupies 1/3 (right side)

2. **Chart Type** (`public/js/dashboard.js`)
   - Changed from three separate doughnut charts to one polar area chart
   - Each segment represents a feature/function area (dashboard, data, deploy, performance)
   - Each ring/dataset represents an environment (Development, Test, Staging)

3. **Performance Links**
   - Simplified from 6 links per environment (1, 3, 7, 14, 30, All days) to 1 button per environment
   - All performance buttons now link to the 1-day performance page for their respective environment

### New Features

#### Interactive Tooltips
When hovering over any segment of the chart, a tooltip displays:
- Environment name
- 1 Day Uptime percentage
- 7 Day Uptime percentage
- 30 Day Uptime percentage

#### Color Coding
Each segment maintains its original status color:
- **Green**: All tests passing
- **Amber**: Some tests failing (above threshold)
- **Red**: Critical failures (below threshold)

#### Legend
A legend is displayed on the right side of the chart showing which ring corresponds to which environment.

## Technical Details

### Chart Configuration
```javascript
type: "polarArea"
- Labels: Feature names (dashboard, data, deploy, performance)
- Datasets: One per environment with:
  - data: Array of 1s (for active features) or 0s (for inactive)
  - backgroundColor: Status colors from API
  - uptimeData: Uptime statistics for tooltips
```

### Data Flow
1. `fetchStatus()` is called for each environment (dev, test, staging)
2. Each call fetches:
   - Current test results from `/results/{environment}`
   - Uptime stats for 1, 7, and 30 days from `/getSummaryStats/{environment}/{days}`
3. Data is stored in `environmentData` object
4. `updateMergedChart()` combines all environment data into the polar area chart

### API Endpoints Used
- `/results/{environment}` - Current test results and colors
- `/getSummaryStats/{environment}/1` - 1-day uptime stats (displayed in sidebar)
- `/getSummaryStats/{environment}/7` - 7-day uptime stats (shown in tooltips)
- `/getSummaryStats/{environment}/30` - 30-day uptime stats (shown in tooltips)

## Benefits

1. **Unified View**: See all environments in one place
2. **Easier Comparison**: Compare feature status across environments at a glance
3. **Reduced Clutter**: Simplified from 18 performance links to 3 buttons
4. **Better UX**: Interactive tooltips provide detailed uptime information on demand
5. **Maintains Accessibility**: All aria-labels and semantic HTML preserved

## Testing

The implementation has been verified to:
- Load all environment data correctly via API endpoints
- Display uptime statistics for each environment
- Generate proper performance page links
- Maintain responsive layout with Bootstrap grid system
- Preserve accessibility features

## Migration Notes

If you need to revert to the old three-chart layout:
1. Restore `pages/dashboard.html` from commit before this change
2. Restore `public/js/dashboard.js` from commit before this change

## Future Enhancements

Potential improvements that could be made:
1. Add filtering to show/hide specific environments
2. Add drill-down capability to show more detailed feature information
3. Add time-based filtering (show different time periods)
4. Add export functionality for the merged view
