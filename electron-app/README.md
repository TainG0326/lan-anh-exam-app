# Exam Lockdown Browser

Desktop application built with Electron to provide a secure exam environment, similar to Safe Exam Browser.

## Features

- ✅ **System Shortcut Blocking**: Prevents Alt+Tab, Win+D, Cmd+Tab, Ctrl+Alt+Del, etc.
- ✅ **Screenshot Protection**: Blocks screenshots using `setContentProtection(true)`
- ✅ **Virtual Machine Detection**: Detects VMs via WebGL vendor information
- ✅ **Kiosk Mode**: Fullscreen mode that cannot be exited during exam
- ✅ **Browser Exam Key (BEK)**: Automatic hash generation for backend validation
- ✅ **URL Navigation Control**: Blocks navigation to external URLs
- ✅ **DevTools Blocking**: Prevents opening developer tools

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

This will create installers for Windows, macOS, and Linux.

## Usage

### Launch with Exam URL

```bash
electron . --exam-url=http://localhost:3002/exams/take/ABC123
```

### Environment Variables

Create `.env` file:

```env
EXAM_SECRET_KEY=your-secret-key-for-bek
API_URL=http://localhost:5000
```

## How It Works

1. **Lockdown Mode**: App starts in kiosk mode (fullscreen)
2. **Shortcut Blocking**: System shortcuts are globally blocked
3. **BEK Generation**: Automatically generates Browser Exam Key hash for each request
4. **VM Detection**: Checks WebGL vendor to detect virtual machines
5. **Request Interception**: All requests include `X-Lockdown-Hash` header

## Security Notes

- Some system shortcuts (like Ctrl+Alt+Del on Windows) cannot be fully blocked
- VM detection can be bypassed by disabling WebGL, but still provides a layer of protection
- BEK secret key must match between client and server

## Troubleshooting

### Shortcuts not blocked
- Some shortcuts require admin privileges
- Check console for errors

### BEK hash mismatch
- Verify `EXAM_SECRET_KEY` matches server configuration
- Check exam ID is correct

### VM detection false positive
- Some graphics drivers may trigger false positives
- Adjust detection logic in `preload.js` if needed



