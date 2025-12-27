# Video Speed Controller Chrome Extension PRD

## 1. Overview
A lightweight Chrome extension that lets online learners precisely control video playback speed with simple keyboard shortcuts and a minimal overlay. It eliminates the need to repeatedly open the player speed menu, saving time and keeping focus on the learning material.

## 2. Problem Statement
Online learning platforms often reset playback speed between sessions, forcing users to manually adjust it each time. Existing keyboard shortcuts vary across sites and rarely support fine-grained 0.1x steps or instant toggling to a preferred speed. This breaks the learner’s flow and wastes time.

## 3. Goals
1. Remove the repetitive task of setting a desired speed for every video.
2. Allow friction-less, fine-grained speed control without leaving the keyboard.
3. Provide clear visual feedback of the current speed without cluttering the screen.

## 4. Non-Goals
• Site-specific presets or global cloud sync (future consideration).
• Support for non-Chromium browsers in the initial MVP.
• Payment, analytics, or multi-user account features.

## 5. Target Users
Primary: Students and self-learners who watch online lectures on Chrome-based browsers (Coursera, Udemy, YouTube Edu, etc.).

## 6. Use Case
While watching an online lecture, the learner presses the “.” key to speed up a fast-forward segment, then taps “,” to slow down for a complex explanation, and hits “r” to jump instantly between normal speed and their preferred 1.8× speed—all without touching the mouse.

## 7. Core Features (MVP)
F1. 0.1× speed change with “,” (−) and “.” (+) keys.  
F2. Toggle between current speed and preferred speed (default 1.8×) with “r” key.  
F3. Small on-screen overlay at top-right showing current speed for 1.2 s after every change.  
F4. Popup UI (extension icon) to change preferred speed value.

## 8. Additional Features (Nice-to-Have for v1.1)
A1. Popup allows editing preferred speed in real time.  
A2. Badge text on the extension icon briefly displays current speed when it changes.

## 9. Functional Requirements
FR1. Works on all mainstream HTML5 video elements within Chrome-based browsers.  
FR2. Keyboard listeners must not interfere with site shortcuts if the video element is not focused.  
FR3. Preferred speed persists in browser storage (chrome.storage.local).  
FR4. Overlay auto-hides after 1.2 s and respects dark/light backgrounds.  
FR5. Performance overhead <1 % CPU on average while idle.

## 10. Non-Functional Requirements
• Extension size ≤ 150 KB zipped.  
• No external network calls (privacy friendly).  
• Must pass Chrome Web Store extension audit (even if sideloaded).

## 11. Success Metrics (for personal use)
• Personal time saved per lecture (subjective).  
• No noticeable video stutter after speed changes.  
• Keyboard response latency <50 ms.

## 12. Technical Constraints
• Manifest V3.  
• Pure JavaScript (ES6) with minimal dependencies.  
• Content script injected on all pages matching “*://*/*”.

## 13. Milestones & Timeline (MVP)
W1: Project scaffolding & manifest setup.  
W2: Implement keyboard listeners & speed control.  
W3: Overlay component & styling.  
W4: Popup UI for preferred speed & storage.  
W5: Testing on major learning sites.  
W6: Packaging & personal sideload.

## 14. Risks & Mitigations
• Site scripts blocking content injections → use shadow DOM and CSS isolation.  
• Keyboard shortcut collision → enable easy toggle on/off via extension popup.

## 15. Future Considerations
• Site-specific presets.  
• Firefox port.  
• Sync preferred speed via Chrome sync storage.