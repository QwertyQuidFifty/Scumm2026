# Scumm2026

A modern point-and-click adventure game inspired by classic LucasArts games like Monkey Island, built with PixiJS and TypeScript.

## 🎮 Play the Game

**[Play Scumm2026 on GitHub Pages](https://qwertyquidfifty.github.io/Scumm2026/)**

## 🎯 Features

- **Classic Adventure Gameplay**: Point-and-click mechanics with cursor-based interaction
- **Dynamic Character System**: 4-directional character movement with animated sprites
- **Interactive Objects**: Pick up items, examine objects, and solve puzzles
- **Inventory System**: Collect and use items throughout your adventure
- **Multi-Stage Environments**: Explore different locations with seamless transitions
- **NPC Dialogue**: Interact with characters through branching conversations
- **Perspective Scaling**: Characters scale naturally based on their position in the scene
- **Action Bar Interface**: Easy-to-use command interface with 6 action buttons

## 🛠️ Technology Stack

- **PixiJS 8.8+**: High-performance 2D WebGL rendering
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **ESLint + Prettier**: Code quality and formatting

## 🚀 Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/qwertyquidfifty/Scumm2026.git
cd Scumm2026
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm start` - Alias for `npm run dev`

## 🎨 Game Controls

- **Left Click**: Interact with objects, move character, or use selected action
- **Right Click**: Examine objects or get information
- **Action Bar**: Click buttons to select different actions (Look, Use, Talk, etc.)
- **Inventory**: Items appear in your inventory when collected

## 🏗️ Project Structure

```
src/
├── Game.ts              # Main game controller
├── CharacterController.ts # Player character movement and animation
├── StageManager.ts      # Scene/stage management
├── AssetManager.ts      # Asset loading and management
├── InventorySystem.ts   # Inventory and item management
├── ActionBar.ts         # UI action buttons
├── CommandPanel.ts      # User interface controls
├── NPCManager.ts        # Non-player character system
├── InteractiveObject.ts # Object interaction system
└── SpriteGenerator.ts   # Dynamic sprite generation
```

## 🎭 Game Features Detail

### Character System
- 4-directional movement (up, down, left, right)
- Smooth pathfinding and collision detection
- Dynamic sprite scaling based on perspective
- Idle and walking animations

### Interactive Objects
- Examine system with descriptive text
- Item pickup and inventory management
- Object states and transformations
- Context-sensitive interactions

### Stage Management
- Multiple game environments
- Seamless transitions between areas
- Perspective-based character scaling
- Interactive hotspots and navigation

### NPC System
- Dialogue trees with multiple responses
- Character animations and movement
- Story progression through conversations
- Dynamic NPC behaviors

## 🔧 Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎮 About

This project recreates the classic adventure game experience with modern web technologies. It captures the essence of 1990s point-and-click adventures while leveraging contemporary development tools and practices.

---

*Built with ❤️ and nostalgia for classic adventure games*