# Planning Guide

BrainSAIT is a comprehensive healthcare ecosystem platform that unifies patient discovery, provider tools, clinical documentation, and revenue cycle management into a single intelligent system for the Saudi Arabian healthcare market.

**Experience Qualities**:
1. **Professional** - Medical-grade interface that conveys trust, precision, and enterprise reliability suitable for clinical environments
2. **Intelligent** - AI-powered assistance feels seamless and contextual, enhancing workflows without friction
3. **Unified** - Disparate healthcare functions feel cohesive through consistent navigation, shared design language, and integrated data flows

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This platform integrates multiple distinct healthcare modules including provider directories, live facility tracking, voice agents, appointment scheduling, messaging, patient intake, provider dashboards, and revenue cycle management systems. Each module has sophisticated state management, real-time data requirements, and complex user workflows.

## Essential Features

### Real-Time Notification System
- **Functionality**: Comprehensive notification center with toast alerts for appointments, messages, critical facility alerts, and system updates
- **Purpose**: Keeps healthcare workers informed of time-sensitive events requiring immediate attention without disrupting workflows
- **Trigger**: System events (new message, upcoming appointment, facility alert) or manual user triggers
- **Progression**: Event occurs → Toast notification appears with priority styling → User clicks notification bell → Notification center panel slides in → Review all notifications → Mark as read or clear → Navigate to related content
- **Success criteria**: Notifications appear within 1 second of event, priority levels clearly distinguished (critical/high/medium/low), unread count badge visible, notifications persist between sessions

### Multi-Module Navigation System
- **Functionality**: Top-level navigation bar that allows instant switching between 10+ distinct healthcare modules
- **Purpose**: Enables healthcare workers to move fluidly between patient-facing and administrative tasks without context switching
- **Trigger**: User clicks module button in global navigation
- **Progression**: Click module button → Animated view transition → New module loads with preserved state → Module-specific UI appears
- **Success criteria**: Navigation responds within 100ms, view transitions are smooth, each module maintains independent state

### Provider/Facility Directory Search
- **Functionality**: Searchable directory of healthcare providers and facilities with filtering, list/map views, and detailed cards
- **Purpose**: Helps patients and staff locate appropriate care providers based on specialty, location, availability, and credentials
- **Trigger**: User enters search term or applies filters
- **Progression**: Enter search query → Apply filters (location, specialty, availability) → Toggle list/map view → Review provider cards with ratings/details → Select provider for more info
- **Success criteria**: Search returns results instantly, filters update view dynamically, map displays accurate provider locations

### Live Facilities Map
- **Functionality**: Real-time visualization of healthcare facilities with status indicators, capacity, and service availability
- **Purpose**: Provides operational awareness of facility status across the healthcare network for coordination and emergency response
- **Trigger**: User navigates to Live Map module
- **Progression**: Load map view → Facilities render with status badges → Click facility → View capacity/services detail panel → Filter by service type or status
- **Success criteria**: Map loads within 2 seconds, status updates are clearly visible, facility details accessible on click

### Voice Agent Interface
- **Functionality**: AI-powered voice interaction system for hands-free documentation and patient interaction
- **Purpose**: Enables clinicians to capture notes and data without typing, improving efficiency during patient encounters
- **Trigger**: User activates voice agent via button or voice command
- **Progression**: Activate agent → Audio visualization appears → Speak naturally → Agent transcribes and structures data → Review/edit transcript → Confirm and save to record
- **Success criteria**: Voice recognition accuracy >95%, responses feel natural, data structured appropriately for medical records

### Appointment Management
- **Functionality**: Calendar-based scheduling system with provider availability, patient details, appointment types, and real-time notifications
- **Purpose**: Centralizes appointment scheduling across providers and facilities with intelligent conflict prevention and proactive reminders
- **Trigger**: User opens appointments module
- **Progression**: View calendar → Select time slot → Choose provider/facility → Enter patient details → Review insurance/notes → Confirm booking → Receive confirmation → Get reminder notifications
- **Success criteria**: No double-bookings possible, calendar syncs across users, appointment details captured completely, notifications sent for upcoming/rescheduled appointments

### Direct Messaging System
- **Functionality**: HIPAA-compliant secure messaging between providers, staff, and patients with real-time notifications
- **Purpose**: Enables secure clinical communication without relying on insecure consumer messaging apps
- **Trigger**: User opens messages module or receives new message
- **Progression**: Select conversation → View message history → Type/dictate message → Attach documents if needed → Send → Recipient receives encrypted message → Notification appears
- **Success criteria**: Messages deliver instantly, attachments supported, conversation history searchable, notifications trigger on new messages

### Patient Intake Forms
- **Functionality**: Digital intake form system capturing demographics, medical history, insurance, and chief complaint
- **Purpose**: Streamlines patient onboarding and ensures complete information capture before provider encounter
- **Trigger**: Patient begins check-in process or staff initiates intake
- **Progression**: Open intake form → Complete demographics → Medical history questions → Insurance verification → Chief complaint entry → Review → Submit → Data flows to EHR
- **Success criteria**: Forms save progress automatically, validation prevents incomplete submissions, data maps to clinical records

### Doctor/Provider Dashboard
- **Functionality**: Provider-centric view showing patient queue, recent charts, tasks, and clinical decision support
- **Purpose**: Gives clinicians a mission control center for their daily workflow and patient panel
- **Trigger**: Provider logs in or navigates to dashboard
- **Progression**: View dashboard → See patient queue → Click patient → Review chart → Access clinical tools → Document encounter → Close chart
- **Success criteria**: Dashboard loads in <2 seconds, patient data is current, clinical tools easily accessible

### CDI (Clinical Documentation Improvement) Module
- **Functionality**: AI-assisted review of clinical documentation to identify gaps, suggest specificity improvements, and ensure coding accuracy
- **Purpose**: Improves documentation quality and coding accuracy, maximizing reimbursement while ensuring clinical accuracy
- **Trigger**: CDI specialist opens module or AI flags chart for review
- **Progression**: Load patient chart → AI highlights documentation gaps → Review suggestions → Query provider for clarification → Update documentation → Confirm improvements
- **Success criteria**: AI suggestions are clinically accurate, workflow reduces query time by 40%, documentation specificity improves

### RCM (Revenue Cycle Management) Module
- **Functionality**: Financial dashboard tracking claims, denials, payments, and revenue metrics across the organization
- **Purpose**: Provides financial visibility and workflow tools to optimize revenue capture and reduce denials
- **Trigger**: RCM staff opens module for daily work
- **Progression**: View dashboard metrics → Identify denied claims → Review denial reason → Correct claim → Resubmit → Track to payment
- **Success criteria**: Real-time financial metrics, denial reasons clearly identified, resubmission workflow streamlined

### Medical Coding Interface
- **Functionality**: AI-assisted medical coding tool that suggests ICD-10, CPT, and other codes based on clinical documentation
- **Purpose**: Accelerates coding workflow and improves accuracy while reducing coder training requirements
- **Trigger**: Coder opens encounter for coding
- **Progression**: Load encounter note → AI suggests codes → Review suggestions → Adjust/add codes → Validate against guidelines → Submit for billing
- **Success criteria**: AI code suggestions are 90%+ accurate, coding time reduced by 50%, audit error rate <2%

## Edge Case Handling

- **Network Interruption** - Forms auto-save progress locally and sync when connection restored with clear offline indicator
- **Concurrent Editing** - Real-time conflict detection with last-write-wins and change notifications to prevent data loss
- **Missing Data** - Smart defaults and clear validation messages guide users to complete required fields
- **Voice Recognition Errors** - Manual correction interface with confidence scores on transcribed text
- **Appointment Conflicts** - Proactive blocking of overlapping appointments with intelligent rescheduling suggestions
- **Insurance Verification Failures** - Graceful degradation allowing appointment booking with manual verification flag
- **Large Dataset Loading** - Virtualized lists and progressive loading with skeleton states prevent UI freezing
- **Mobile Responsiveness** - Touch-optimized controls and responsive layouts adapt complex workflows to smaller screens

## Design Direction

The design should evoke trust, precision, and technological sophistication suitable for a medical environment while feeling modern and approachable. It should balance clinical professionalism with contemporary software aesthetics—think "SpaceX mission control meets modern healthcare." The interface should feel intelligent without being overwhelming, using subtle animations and clear information hierarchy to guide users through complex workflows. The color scheme should be calming yet energizing, using a dark mode foundation with vibrant cyan/teal accents that suggest medical technology and clarity.

## Color Selection

A sophisticated dark mode palette with vibrant cyan accents creates a high-tech medical aesthetic that reduces eye strain during long shifts while maintaining clear information hierarchy.

- **Primary Color**: Bright Cyan (`oklch(0.87 0.15 195)`) - Represents clarity, precision, and medical technology; used for primary actions, active states, and key interactive elements
- **Secondary Colors**: 
  - Deep Teal Background (`oklch(0.15 0.02 195)`) - Primary canvas color providing calm, focused environment
  - Mid Teal Surface (`oklch(0.20 0.03 195)`) - Card and elevated surface color creating subtle depth
  - Light Teal Border (`oklch(0.28 0.04 195)`) - Dividers and borders for subtle separation
- **Accent Color**: Electric Cyan (`oklch(0.87 0.15 195)`) - Attention-grabbing highlights for CTAs, notifications, and important status indicators
- **Foreground/Background Pairings**:
  - Background Deep Teal (`oklch(0.15 0.02 195)`): White text (`oklch(0.98 0 0)`) - Ratio 12.8:1 ✓
  - Surface Mid Teal (`oklch(0.20 0.03 195)`): White text (`oklch(0.98 0 0)`) - Ratio 10.2:1 ✓
  - Primary Cyan (`oklch(0.87 0.15 195)`): Dark text (`oklch(0.15 0.02 195)`) - Ratio 8.9:1 ✓
  - Muted elements (`oklch(0.55 0.02 195)`): Background - Ratio 4.6:1 ✓

## Font Selection

Typography should convey precision and modernity while maintaining excellent readability for extended use in clinical settings. A combination of geometric sans-serif for UI elements and versatile sans-serif for content creates a technical yet approachable feel.

Primary: **Space Grotesk** - Geometric sans-serif with technical character perfect for headings and navigation
Secondary: **Inter** - Highly legible sans-serif optimized for UI and body text

- **Typographic Hierarchy**:
  - H1 (Module Titles): Space Grotesk Bold/32px/tight tracking (-0.033em)
  - H2 (Section Headers): Space Grotesk Bold/24px/normal tracking
  - H3 (Card Titles): Space Grotesk SemiBold/18px/normal tracking
  - Body (Primary): Inter Regular/16px/relaxed leading (1.6)
  - Body (Secondary): Inter Regular/14px/relaxed leading (1.5)
  - Caption/Labels: Inter SemiBold/12px/wide tracking (0.05em)/uppercase
  - Button Text: Inter Bold/14px/normal tracking

## Animations

Animations should feel precise and purposeful, enhancing clarity and providing feedback without slowing down experienced users. Use subtle micro-interactions for state changes (100-150ms), smooth view transitions (300ms) with slide/fade combinations, and gentle pulsing effects for real-time status indicators. Voice agent visualizations should have fluid audio-reactive animations. Loading states use skeleton screens that fade into content. All animations use easing curves that feel natural (ease-out for entrances, ease-in-out for continuous motion).

## Component Selection

- **Components**:
  - **Navigation**: Custom tabbed navigation bar with active state indicators using Pills pattern and notification bell icon
  - **Notification Center**: Custom sliding panel with notification list, filters, and actions
  - **Toast Notifications**: Sonner for real-time toast notifications with priority-based styling
  - **Cards**: Shadcn Card component for provider/facility listings with hover elevation effects
  - **Buttons**: Shadcn Button with Primary (cyan), Secondary (teal), and Ghost variants
  - **Inputs**: Shadcn Input with custom focus states showing cyan ring glow
  - **Dialogs**: Shadcn Dialog for appointment booking, message composition, and form overlays
  - **Tabs**: Shadcn Tabs for module subsections (calendar view types, report filters)
  - **Calendar**: React-day-picker for appointment scheduling with custom styling
  - **Maps**: Custom SVG map visualization with interactive facility markers
  - **Voice Interface**: Custom component with audio visualization using canvas/SVG
  - **Sidebar**: Shadcn Sidebar for directory filters and navigation
  - **Toast**: Sonner for notifications and confirmations
  - **Badge**: Shadcn Badge for status indicators (available, urgent, new)
  - **Avatar**: Shadcn Avatar for provider images and user profiles
  - **Scroll Area**: Shadcn ScrollArea for message threads and long lists

- **Customizations**:
  - Custom Card hover effects with subtle scale and shadow transitions
  - Voice agent audio visualization component built with canvas
  - Interactive map component with custom facility markers and info panels
  - AI assistant floating action button with pulse animation
  - Custom filter chips with remove buttons
  - Search bar with integrated action buttons and icon transitions

- **States**:
  - Buttons: Subtle scale on active (0.95), cyan glow on hover, disabled at 50% opacity
  - Inputs: Border transitions from transparent to cyan with 15px glow shadow on focus
  - Cards: Elevation increases on hover (shadow intensifies), selected state with cyan border
  - Navigation tabs: Active tab has cyan background with 15px glow effect
  - Status badges: Pulsing animation for real-time indicators, color-coded by urgency

- **Icon Selection**:
  - Use Material Symbols Outlined for consistent medical/tech aesthetic
  - Phosphor Icons for notification system (Bell, Calendar, Chat, Warning, Check, Trash)
  - Search: search icon
  - Navigation: folder_shared, radar, graphic_eq, calendar_month, chat, content_paste, stethoscope
  - Actions: add, edit, delete, close, arrow_forward
  - Status: check_circle, error, warning, info
  - Medical: local_hospital, medication, favorite, vaccines

- **Spacing**:
  - Container padding: px-4 md:px-6 (16px mobile, 24px desktop)
  - Section gaps: gap-6 (24px) for major sections
  - Card gaps: gap-4 (16px) internal card spacing
  - Button padding: px-4 py-2 (standard), px-6 py-3 (large)
  - Input height: h-12 (48px) for comfortable touch targets

- **Mobile**:
  - Navigation: Horizontal scroll for module tabs on mobile with pill buttons
  - Search bar: Stack search input full width, move buttons inline-right, collapse text labels
  - Directory: Single column card layout on mobile, two columns on desktop
  - Map view: Full screen on mobile with bottom sheet for facility details
  - Sidebar: Convert to slide-over drawer on mobile activated by hamburger menu
  - Forms: Full-width stacked inputs with increased touch targets (min 44px height)
  - Floating AI assistant: Positioned bottom-right with reduced size on mobile
