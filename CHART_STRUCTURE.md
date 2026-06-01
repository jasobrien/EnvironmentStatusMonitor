# Chart Structure Diagram

## Polar Area Chart Layout

```
                    [dashboard]
                        /\
                       /  \
                      /    \
                     /      \
        [performance]        [data]
                    \        /
                     \      /
                      \    /
                       \  /
                        \/
                    [deploy]

```

## Ring Structure (from center outward)

Rings are generated dynamically from the `environments` array in [config/config.js](config/config.js) — there is no hardcoded ring count. With the default 4-environment config the layout is:

```
┌───────────────────────────────────┐
│                                     │
│  Ring 1 (Inner):  Development      │
│  Ring 2:          Test              │
│  Ring 3:          Staging           │
│  Ring 4 (Outer):  Production        │
│                                     │
│  (rings auto-add as you add envs)   │
└───────────────────────────────────┘
```

When viewing a saved dashboard (`/dashboard/view/:id`) the rings/segments are filtered to the dashboard's `environments`, `tests`, and `runner` selectors — see [MERGED_DASHBOARD_CHANGES.md](MERGED_DASHBOARD_CHANGES.md).

## Color Coding

Each segment can be one of three colors based on test results:

- 🟢 **Green**: All tests passing (100% success)
- 🟡 **Amber**: Some tests failing (≥90% success)
- 🔴 **Red**: Critical failures (<90% success)

## Example Visualization

```
      dashboard (Green)
           /\
          /  \
         / D  \
    perf|======| data
     (G)|  T   |(G)
        | S    |
         \    /
          \  /
           \/
      deploy (Green)

Legend:
D = Development (innermost ring)
T = Test (middle ring)
S = Staging (outermost ring)
G = Green status
```

## Tooltip Example

When hovering over the "dashboard" segment in the "Test" ring:

```
┌─────────────────────────────────┐
│ dashboard                        │
├─────────────────────────────────┤
│ Environment: Test                │
│ 1 Day Uptime: 100.00%           │
│ 7 Day Uptime: 99.85%            │
│ 30 Day Uptime: 98.50%           │
└─────────────────────────────────┘
```

## Layout Structure

```
┌───────────────────────────────────────────────────────┐
│            All Environments Status                     │
├────────────────────────────┬─────────────────────────┤
│                            │ Environment Uptime       │
│                            │ (1 Day)                  │
│                            │                          │
│     [Polar Area Chart]     │ Development              │
│     - dashboard segment    │ 1 Days: 100.00%         │
│     - data segment         │ [Performance Stats]      │
│     - deploy segment       │                          │
│     - performance segment  │ Test                     │
│                            │ 1 Days: 100.00%         │
│     With 3 rings:          │ [Performance Stats]      │
│     - Dev (inner)          │                          │
│     - Test (middle)        │ Staging                  │
│     - Staging (outer)      │ 1 Days: 100.00%         │
│                            │ [Performance Stats]      │
│                            │                          │
├────────────────────────────┴─────────────────────────┤
│ Last Updated: 10/10/2025, 9:26:01 PM                 │
└───────────────────────────────────────────────────────┘
```

## Data Flow

```
API Endpoints (one set per configured environment)
     │
     ├──> /results/{env}/                      ┐
     ├──> /results/{env}/{runner}/              │  (when a runner filter is active)
     │                                          │
     ├──> /getSummaryStats/{env}/1             │
     ├──> /getSummaryStats/{env}/7             ├───> environmentData{}
     ├──> /getSummaryStats/{env}/30            │         │
     ├──> /getSummaryStats/{env}/{runner}/{N}  │         ▼
     │                                          │   updateMergedChart()
     └──> /histresultskeys/{env}?runner=...    ┘         │
                                                          ▼
                                                Polar Area Chart
                                                with Tooltips
```

## Technical Details

### Chart.js Configuration

```javascript
type: "polarArea"
datasets: [
  {
    label: "Development",
    data: [1, 1, 1, 1],  // One value per feature
    backgroundColor: ["Green", "Green", "Green", "Green"],
    uptimeData: [{day1: "100.00", day7: "99.85", day30: "98.50"}, ...]
  },
  {
    label: "Test",
    data: [1, 1, 1, 1],
    backgroundColor: ["Green", "Green", "Green", "Green"],
    uptimeData: [...]
  },
  {
    label: "Staging",
    data: [1, 1, 1, 1],
    backgroundColor: ["Green", "Green", "Green", "Green"],
    uptimeData: [...]
  }
]
```

### Segment Order (Clockwise from top)

1. dashboard
2. data
3. deploy
4. performance

(Order determined by the order features are returned from the API)
