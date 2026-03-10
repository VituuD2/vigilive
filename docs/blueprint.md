# **App Name**: Vigilive Admin

## Core Features:

- User Authentication & Access Control: Secure user login/logout, session management, and role-based route protection for admin users, utilizing Supabase Auth.
- Target Lifecycle Management: Admin interface to create, read, update, activate, pause, and delete monitoring targets, including robust input validation.
- Recording Overview & Details: View a list of recorded streams with their status and key metadata, and detailed pages showing playback info, associated files, and event logs.
- Operational Metrics Dashboard: A central dashboard displaying key operational metrics, system health, and an activity feed for administrative and system events.
- Secure Supabase Storage Integration: Robust handling of recorded media files, thumbnails, and other assets using Supabase Storage, including path conventions and signed URLs for secure access.
- Comprehensive Logging & Audit Trails: Persistence of structured system, operational, and audit logs within the database, providing full traceability for administrative actions and engine activities.
- Automated Log Analysis Tool: An AI-powered tool to interpret complex sequences of system and recording event logs, providing summary insights or anomaly suggestions for easier operational understanding.

## Style Guidelines:

- The chosen color scheme is dark, optimizing for prolonged screen use and enhancing focus on data. The primary action color is a robust blue (#2689DB), representing stability and technology, which contrasts effectively with the deep, subtly cool background (#111213).
- A vibrant cyan (#69CFCB) serves as the accent color, used for active states, positive indicators, and interactive elements, providing clear visual feedback and distinguishing itself from the primary blue.
- The main user interface and body text will use 'Inter', a grotesque-style sans-serif, for its modern, objective appearance and excellent readability across various data densities.
- For displaying code snippets, system logs, or technical data, 'Source Code Pro' (monospace sans-serif) will be used to maintain clear, consistent formatting.
- Icons should be clean, line-based, and consistent, derived from a professional library compatible with shadcn/ui to maintain a modern and efficient aesthetic.
- A clear, grid-based layout prioritizing data readability and efficient navigation. Key information should be easily scannable, and panels should adapt to accommodate various data types without feeling cluttered. Responsiveness is key for internal flexibility.
- Subtle and purposeful animations will be employed for state changes, data loading, and interactive elements, providing a polished user experience without being distracting. These should aid understanding and indicate system activity.