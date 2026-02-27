# ⚔️ Quest Log

A gamified TODO tracker with focus timers, XP progression, and pretty analytics.

## 🎮 Features

- **Task Management**: Organize quests by category, priority, and due date
- **Focus Timer**: Track time spent on each task with visual tree growth
- **XP & Leveling**: Experience points and levelling up as you complete tasks
- **Streak System**: Build daily completion streaks
- **Analytics Dashboard**: 
  - Mirrored bar charts showing total time (top) and category breakdown (bottom). Let me reiterate: this took way too long to implement correctly 🎃
  - Color-coded productivity goals (8h+ glows green!)
  - 7/14/30 day views (which seem to work in different size windows. Took a while 🎃)
  - Category time breakdown
- **CSV Export**: Export for future you 
- **Growing Forest**: Completed tasks become trees in your personal forest (yes, I did get inspired by the Forest app, good Uni times 🥹)

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

## 📊 Analytics Colour Bonanza 🦄

### Bar Chart Colors (Top Bar - Total Time)
- **Gray**: < 1 hour
- **Orange**: 1-2 hours  
- **Bright Orange**: 2-4 hours
- **Yellow**: 4-6 hours
- **Green**: 6-8 hours
- **✨ Glowing Teal/Green**: 8+ hours (TARGET!)


The chart scales to 12 hours max. Top bar shows total, bottom by category.

### Tree Growth Stages (because I'm a plant, you see! 💚)
- 🌱 Seedling: < 1 hour
- 🌿 Sapling: 1-2 hours
- 🌳 Tree: 2-3 hours  
- 🌲 Mature Tree: 3-4 hours
- 🎄 **Christmas Tree: 5+ hours** (a fancy plant, if you will)

## 💾 Data Storage

All data is stored in browser localStorage:
- Persists between sessions
- No server required
- Export to CSV anytime for backups
- causes pain and suffering if you're new to this and your browser has layers of security settings 🎃

### Custom Categories

You can add your own categories! Go to the "New" tab and expand "Manage Categories" to create custom quest types. Mine are just the diversity which comes to mind in daily life 😬. Also: food and drink breaks are for funsies because I love my tea with Elias and Gaurav ☕️ 🥗 🍵

## 🔧 Customization

### Adjusting Time Goals

In `quest-log.jsx`, you can customize:

**Tree growth thresholds** (function `getGrowthStage`):
```javascript
if (min < 60) return 0;    // Adjust these values
if (min < 120) return 1;
// etc.
```

**Chart maximum** (in `AnalyticsChart`):
```javascript
const barHeight = Math.max(2, (totalMin / 720) * 130); // 720 = 12h max
```

<br>

# **Happy questing!** ⚔️✨
