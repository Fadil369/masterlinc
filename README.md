# MASTERLINC Dashboard

A sophisticated, bilingual (English/Arabic) agent orchestration dashboard for the BrainSAIT LINC ecosystem. Built with React, TypeScript, and Tailwind CSS.

## Features

### 🌐 Bilingual Interface
- **Full English/Arabic Support** - Complete interface translation
- **RTL Layout** - Proper right-to-left layout for Arabic
- **Arabic Fonts** - IBM Plex Sans Arabic for optimal readability
- **Seamless Switching** - Toggle between languages instantly

### 🤖 Agent Management
- **Agent Registry** - View all registered agents with real-time status
- **Category Filtering** - Filter by healthcare, business, automation, content, security
- **Search Functionality** - Search agents by name, ID, or description
- **Status Monitoring** - Visual indicators for online/offline/degraded/maintenance
- **Capability Display** - View agent capabilities and versions
- **Priority Levels** - Agents sorted by priority and status

### 📨 Message Communication
- **Message Log** - View all messages between agents
- **Send Messages** - Create and send messages between any agents
- **Real-time Updates** - Messages appear instantly with animations
- **Status Tracking** - Track delivery status (delivered/pending/failed)
- **Content Preview** - View JSON message payloads

### 📊 System Dashboard
- **System Health** - Monitor overall system status
- **Agent Metrics** - Quick stats on registered agents
- **Recent Activity** - View latest messages and agent updates
- **Service Status** - Check database, Redis, message queue health
- **Uptime Tracking** - System uptime display

### 🔄 Workflow Management
- **Workflow Creation** - (Ready for implementation)
- **Multi-agent Orchestration** - Coordinate actions across agents
- **Step-by-step Execution** - Define sequential agent operations

## Technology Stack

- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Beautiful, accessible components
- **Phosphor Icons** - Comprehensive icon set
- **Sonner** - Toast notifications
- **Spark KV Storage** - Persistent state management

## Design System

### Colors
- **Primary (Teal)**: `oklch(0.55 0.15 200)` - Healthcare trust and precision
- **Accent (Cyan)**: `oklch(0.70 0.18 210)` - CTAs and active states
- **Success (Green)**: `oklch(0.65 0.18 150)` - Online status
- **Warning (Yellow)**: `oklch(0.75 0.15 80)` - Degraded status
- **Purple**: `oklch(0.50 0.18 290)` - Business/automation category

### Typography
- **IBM Plex Sans** - Primary interface font
- **IBM Plex Sans Arabic** - Arabic text
- **JetBrains Mono** - Agent IDs, endpoints, code

### Components
All components built with shadcn/ui v4:
- Cards, Badges, Buttons
- Tabs, Dialogs, ScrollArea
- Select, Input, Textarea
- Tooltip, Switch

## Data Persistence

All data persists using Spark's KV storage:
- `masterlinc-language` - User's language preference
- `masterlinc-agents` - Agent registry
- `masterlinc-messages` - Message log
- `masterlinc-workflows` - Workflow definitions

## Agent Categories

### Healthcare
- **DoctorLINC** - Clinical decision support
- **NurseLINC** - Nursing workflow automation
- **PatientLINC** - Patient engagement

### Business
- **BizLINC** - Business intelligence & analytics

### Security
- **AuthLINC** - Authentication & security gateway

### Content
- **ContentLINC** - Content generation & management

## Mock Data

The app includes realistic mock data for demonstration:
- 6 sample agents (healthcare, business, content, security)
- Pre-populated messages showing agent communication
- System health metrics
- Bilingual agent names and descriptions

## Real-time Features

- **Auto-refresh** - Agent heartbeats update every 10 seconds
- **Live Updates** - Messages appear with smooth animations
- **Status Changes** - Agents can change status dynamically
- **Uptime Counter** - System uptime increments automatically

## Responsive Design

- **Mobile-first** - Optimized for all screen sizes
- **Breakpoints**:
  - Mobile: Single column layout
  - Tablet: 2-column grid
  - Desktop: 3-column grid
- **Touch-friendly** - Large tap targets for mobile
- **Adaptive UI** - Drawers on mobile, modals on desktop

## Accessibility

- **WCAG AA Compliant** - All color contrasts meet standards
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Ready** - Semantic HTML
- **Focus Indicators** - Clear focus states
- **ARIA Labels** - Proper labeling

## Arabic/RTL Support

- **Complete RTL** - Entire layout flips for Arabic
- **Proper Text Flow** - Arabic text reads right-to-left
- **Icon Positioning** - Icons adjust for RTL
- **Number Formatting** - Respects locale
- **Date/Time** - Arabic locale formatting

## Future Enhancements

1. **Real Backend Integration** - Connect to actual MASTERLINC API
2. **WebSocket Support** - Real-time agent communication
3. **Workflow Builder** - Visual workflow creation interface
4. **Advanced Metrics** - Charts and analytics
5. **Agent Configuration** - Edit agent settings
6. **Message Filtering** - Filter by agent, type, status
7. **Export/Import** - Backup and restore data
8. **Dark Mode** - Theme switching
9. **Multi-language** - Add French, Spanish support
10. **Performance Dashboard** - Agent performance metrics

## Usage

### Viewing Agents
1. Navigate to the "Agents" tab
2. Use search to find specific agents
3. Filter by category
4. Click any agent card for details

### Sending Messages
1. Go to the "Messages" tab
2. Click "Send Message"
3. Select sender and receiver agents
4. Enter message content (JSON format)
5. Click "Send"

### Monitoring System
1. View the "Dashboard" tab
2. Check system health status
3. Monitor recent activity
4. View agent metrics

### Changing Language
1. Click the EN/AR toggle in the header
2. Interface immediately switches
3. Preference is saved automatically

## Development Notes

- Built as a frontend demonstration of the MASTERLINC concept
- Uses mock data but structured for easy API integration
- All components are production-ready
- Follows React best practices
- Type-safe with TypeScript
- Accessible and responsive

## Credits

Part of the BrainSAIT LINC ecosystem - a Saudi healthcare digital transformation initiative.

**MASTERLINC** = **M**ulti-**A**gent **S**ystem for **T**ransformative **E**nterprise **R**esource **L**anguage-**I**ntegrated **N**etworked **C**oordination

---

**Built with ❤️ for healthcare innovation**
