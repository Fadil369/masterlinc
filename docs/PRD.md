# MASTERLINC Dashboard - Product Requirements Document

A sophisticated web-based dashboard for monitoring and orchestrating BrainSAIT LINC agents with real-time communication visualization and bilingual support.

**Experience Qualities**:
1. **Powerful** - Immediately conveys control and visibility over a complex agent ecosystem
2. **Responsive** - Real-time updates create the feeling of a living, breathing system
3. **Professional** - Enterprise-grade interface with attention to detail and polish

**Complexity Level**: Complex Application (advanced functionality with multiple views)
Selected because this application manages real-time agent orchestration, message routing, workflow visualization, and system health monitoring across multiple interconnected agents.

## Essential Features

### Agent Registry Management
- **Functionality**: Display all registered agents with their status, capabilities, and metadata
- **Purpose**: Provides centralized visibility into the agent ecosystem
- **Trigger**: Automatic on app load, manual refresh available
- **Progression**: App loads → Fetch agent data → Display in grid layout → Auto-refresh every 10s → User can filter/search
- **Success criteria**: All agents displayed with accurate status, bilingual names shown, responsive grid layout

### Real-time Message Visualization
- **Functionality**: Show live message flow between agents with visual connections
- **Purpose**: Understand communication patterns and debug routing issues
- **Trigger**: Automatic when messages are sent between agents
- **Progression**: Message sent → Animate from sender to receiver → Display in log → Store in history
- **Success criteria**: Smooth animations, messages appear instantly, log maintains chronological order

### Workflow Builder
- **Functionality**: Create multi-step workflows that route through different agents
- **Purpose**: Enable complex orchestration scenarios without code
- **Trigger**: User clicks "Create Workflow" button
- **Progression**: Click button → Open builder modal → Select agents → Define steps → Preview flow → Save workflow
- **Success criteria**: Intuitive drag-and-drop or step interface, visual validation, workflows can be executed

### System Health Dashboard
- **Functionality**: Monitor agent health, uptime, and performance metrics
- **Purpose**: Proactive monitoring and quick identification of issues
- **Trigger**: Automatic heartbeat monitoring
- **Progression**: Dashboard loads → Poll health endpoints → Update status indicators → Alert on failures
- **Success criteria**: Health status updates within 1 second, clear visual indicators, historical data preserved

### Bilingual Interface (Arabic/English)
- **Functionality**: Full interface and agent data displayed in both languages
- **Purpose**: Support Saudi healthcare requirements and international teams
- **Trigger**: Language toggle in header
- **Progression**: User clicks language toggle → Interface text switches → Agent names/descriptions update → RTL layout for Arabic
- **Success criteria**: Complete translation coverage, proper RTL support, smooth transition

## Edge Case Handling

- **Agent Offline Handling**: When agents go offline, immediately update status indicator to red, show "Last seen" timestamp, and move to bottom of active list
- **Message Delivery Failure**: Display error notification, mark message as failed in log, provide retry button
- **Empty States**: Show helpful illustrations and CTAs when no agents registered, no messages sent, or no workflows created
- **Network Disconnection**: Display banner warning user of connection loss, queue actions, auto-reconnect when available
- **Large Message Volumes**: Implement virtual scrolling for message log, pagination for history, and auto-cleanup of old messages

## Design Direction

The design should evoke a sense of **command center sophistication** - like monitoring a space mission or air traffic control, but with warmth and accessibility. Think high-tech healthcare meets modern SaaS dashboard. The interface should feel precise, professional, and powerful while remaining approachable. Visual elements should suggest connectivity, flow, and orchestration.

## Color Selection

The palette draws inspiration from medical technology interfaces with touches of Saudi cultural colors.

- **Primary Color**: Deep teal (oklch(0.55 0.15 200)) - Represents healthcare trust and technical precision, evokes both medical equipment displays and Saudi architectural elements
- **Secondary Colors**: 
  - Warm sand (oklch(0.82 0.05 70)) - Subtle nod to Saudi desert landscapes, used for secondary backgrounds
  - Rich purple (oklch(0.50 0.18 290)) - For business/automation agents, suggests sophistication
- **Accent Color**: Vibrant cyan (oklch(0.70 0.18 210)) - For CTAs, active states, and message flow animations; energetic yet professional
- **Foreground/Background Pairings**: 
  - Primary on Background (oklch(0.55 0.15 200) on oklch(0.98 0.01 200)): Contrast ratio 6.8:1 ✓
  - Accent on Card (oklch(0.70 0.18 210) on oklch(0.96 0.01 200)): Contrast ratio 5.2:1 ✓
  - Foreground on Background (oklch(0.20 0.02 220) on oklch(0.98 0.01 200)): Contrast ratio 12.1:1 ✓

## Font Selection

Typography should convey technical precision while maintaining excellent readability in both Latin and Arabic scripts.

**Primary**: IBM Plex Sans - Modern grotesque with technical heritage, excellent multilingual support including Arabic
**Code/Data**: JetBrains Mono - For agent IDs, endpoints, and message payloads; monospaced clarity

- **Typographic Hierarchy**: 
  - H1 (Page Title): IBM Plex Sans SemiBold/32px/tight (-0.02em)
  - H2 (Section Headers): IBM Plex Sans Medium/24px/normal (0em)
  - H3 (Card Titles): IBM Plex Sans Medium/18px/normal (0em)
  - Body (Primary): IBM Plex Sans Regular/15px/relaxed (1.6 line-height)
  - Caption (Metadata): IBM Plex Sans Regular/13px/normal (0.01em)
  - Code (Technical): JetBrains Mono Regular/14px/normal (1.5 line-height)

## Animations

Animations should emphasize the flow of information and system responsiveness while maintaining professional restraint.

**Key Animation Moments**:
- Agent status changes fade and scale (200ms ease-out)
- Message routing uses animated SVG paths with gradient trails (400ms ease-in-out)
- Card hover elevates with shadow transition (150ms ease)
- Health metrics pulse subtly when updating (300ms ease)
- Modal/drawer entrances slide with fade (250ms ease-out)
- Language toggle triggers smooth text crossfade (200ms)

## Component Selection

- **Components**: 
  - Cards (agent display) - shadcn Card with custom hover states and status badges
  - Tabs (main navigation) - shadcn Tabs for switching between Dashboard/Agents/Messages/Workflows
  - Badge (status indicators) - shadcn Badge with custom colors for online/offline/degraded states
  - Dialog (workflow creation) - shadcn Dialog for modal forms
  - Select (filtering) - shadcn Select for agent category filtering
  - Separator (section dividers) - shadcn Separator for visual hierarchy
  - ScrollArea (message logs) - shadcn ScrollArea for contained scrolling regions
  - Tooltip (agent details) - shadcn Tooltip for hover information
  - Avatar (agent icons) - shadcn Avatar with fallback to initials
  - Switch (language toggle) - shadcn Switch for Arabic/English
  
- **Customizations**: 
  - Custom animated SVG component for message flow visualization
  - Custom status dot component with pulse animation
  - Custom metric card with sparkline charts using D3
  
- **States**: 
  - Buttons: subtle background on hover, scale down on active, disabled state with opacity
  - Cards: elevation on hover, border highlight on active/selected
  - Status badges: solid fill with pulse animation when online, muted when offline
  
- **Icon Selection**: 
  - Broadcast/Broadcast (agent communication)
  - Activity/ChartLine (health metrics)
  - Lightning/LightningCharge (workflows)
  - CircleDashed/Circle (status indicators)
  - Globe/GlobeHemisphereWest (language toggle)
  - ArrowsClockwise/ArrowClockwise (refresh)
  - Plus/PlusCircle (add actions)
  
- **Spacing**: 
  - Page padding: p-6 (24px) on desktop, p-4 (16px) on mobile
  - Card gaps: gap-4 (16px) in grids
  - Section spacing: space-y-6 (24px) between major sections
  - Inline spacing: space-x-3 (12px) for button groups
  - Card internal: p-6 (24px) for content, p-4 (16px) for compact cards
  
- **Mobile**: 
  - Grid layout: 3 columns desktop → 2 columns tablet → 1 column mobile
  - Navigation tabs become horizontal scroll on mobile
  - Message visualization simplified to list view on small screens
  - Floating action button for quick actions on mobile
  - Drawer instead of modal for workflow creation on mobile
  - Status metrics stack vertically on mobile
