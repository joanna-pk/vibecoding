# 🌌 CodeBit: virtual AstroPet feeding on small accomplishments

A progress monitoring web pet that evolves based on your work. From hydrogen atom to X-ray binary, your cosmic companion grows with your productivity. I am going to make it pretty, animated and fun -- just you wait for our cozy tippy tapping evenings 🧡🎃.

## ✨ Features

- **Pet Evolution System**: 7 stages (Hydrogen Atom → Spectral Line → Protostar → Main Sequence → Red Giant → Black Hole → X-ray Binary (a Black Hole stripping a companion star))
- **Work Logging**: Track actions across 4 skill categories (JAX/ML, XSTAR/X-ray, Galaxies/UVEX, Bayes/Stats)
- **GitHub Integration**: 
  - Sync your GitHub profile
    - View contribution heatmap
    - See recent repos
    - **Auto-XP**: Earn +15 XP for every commit (auto-detected!) 🚧 ==*underway*==
- **Paper Reading List**: Track papers by category and relevance
- **Weekly Reports**: XP charts, skill focus breakdown, distraction warnings
- **Streak System**: Daily work streaks

## 🚀 Quick Start

### Option A: Just Open It (Easiest!)
1. Open `index.html` in your browser
2. Done! 🎉

### Option B: Local Server (Recommended)
```bash
npx http-server
# Open http://localhost:8080
```

No build process, no dependencies! It's a single HTML file for now. 🚧 ==*will port to React*==

## 🐾 How to Use

### 1. Log Work
- Click "// Log Work" tab
- Choose category tabs 
- Click actions you've completed
- Each action awards XP and increases skill levels

### 2. Connect GitHub
- Click "✦ Pet" tab
- Enter your GitHub username
- Click "Sync ⬡"
- Your commits will be automatically detected every 5 minutes
- **+15 XP per commit!**

### 3. Track Papers
- Click "∂ Papers" tab
- Add papers you're reading
- Mark relevance (Core / Adjacent / Tangential)
- Get warned if you're reading too many tangential papers!

### 4. Review Progress
- Click "◈ Report" tab
- See weekly XP breakdown
- View skill focus distribution
- Check paper category stats

## 🌟 Evolution Stages

Your pet evolves based on total XP:

| Stage | Min XP | Name | Pet Name | Description |
|-------|--------|------|----------|-------------|
| I | 0 | Hydrogen Atom | Planck | Waiting to be observed |
| II | 60 | Spectral Line | Payne-Gaposchkin | Faint emission from the void |
| III | 180 | Protostar | Roman | Gravity winning, collapse beginning |
| IV | 380 | Main Sequence | Leavitt | Steady hydrogen fusion |
| V | 700 | Red Giant | Burnell | Shell burning, pulsing |
| VI | 1100 | Black Hole | Penrose | Veiled in the Event Horizon |
| VII | 1700 | **X-ray Binary** | García | Accretion disk blazing! 🌟 |

Each stage is named after a pioneering astrophysicist! Also: Most of them are women 👩🏼‍🔬

## 📊 Work Actions & XP

### General Actions (15-30 XP each)
- Pushed a commit: 15 XP
- Crushed a bug: 12 XP
- Refactored code: 18 XP
- Shipped a feature: 30 XP
- Code review: 20 XP

### Category-Specific Actions
Each category (JAX, X-ray, Galaxies, Bayes) has 6 specialized actions ranging from 15-35 XP.

### GitHub Auto-XP
- Every commit: **+15 XP** (detected automatically every 5 minutes!)

## 🎨 Customization

### Adding New Actions

Find the `ACTIONS` object in the `<script>` section:

```javascript
const ACTIONS = {
  gen: [
    { id:'my_action', xp:20, ico:'🎯', label:'Did something cool', stat:'', cls:'', log:'Achievement unlocked! 🎯' },
    // Add your own!
  ],
  // ...
}
```

### Adjusting Evolution Thresholds

Find the `STAGES` array:

```javascript
const STAGES = [
  { id:'hydrogen', name:'HYDROGEN ATOM', minXP:0, pName:'Planck', quote:'...' },
  // Adjust minXP values to change evolution speed
];
```

### Changing GitHub Poll Interval

Find this line:
```javascript
setInterval(checkNewCommits, 5 * 60 * 1000); // Currently 5 minutes
```

## 💾 Data Storage

Everything is stored in browser localStorage:
- Pet XP and evolution stage
- Work log history
- Paper list
- GitHub connection
- Streak data

**Data persists between sessions** as long as you use the same browser and don't clear browser data. Not sure how to fix that yet.


## 🔮 Planned amazement

- **React Migration**: Reusable componenents and state management + future scaling
- **Constellation System**: Collect multiple pets!
- **N-body Physics**: Pets orbit each other based on their mass
- **Dark Matter**: Background effect that reveals with 10+ pets (shhh! super secret 🤫)
- **Cross-app Integration**: Sync XP with Quest Log (gosh that will take forever, won't it)

---

**Made with cosmic love** 🌟✨ <br>
**And Claude. A lot of Claude.**

*Pet names honor: Max Planck, Cecilia Payne-Gaposchkin, Nancy Grace Roman, Henrietta Leavitt, Jocelyn Bell Burnell, Roger Penrose, and Javier García (he's a cool guy, don't come after me! Might as well be immortalised as an X-ray binary web pet)*
