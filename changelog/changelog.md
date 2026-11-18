# Changelog

## 2.6.1 - 2026-11-18

Navigation, connection, and availability fixes.

- Fixed: Swipe-back (iOS) and predictive-back (Android) gestures work again on every screen.
- Improved: The premium paywall opens as a bottom sheet that you can swipe down to dismiss.
- Fixed: Content is no longer drawn underneath the Android system navigation bar.
- Fixed: The connect screen now prefills the subnet from your device's LAN IP, and ignores VPN, cellular, and Wi-Fi Direct addresses.
- Fixed: Netshare is now available on Google Play for devices without Wi-Fi hardware.

## 2.6.0 - 2026-11-17

End-to-end encryption for every transfer.

- New: End-to-end encryption: all client-host traffic is tunneled through an X25519 + ChaCha20-Poly1305 channel.
- New: Verify who you connect to: the QR code carries the host key fingerprint, and manual connections are confirmed with a 6-digit code.
- New: Encryption status indicator, with a clear warning when a connection falls back to unencrypted HTTP for older peers.
- New: Premium purchase to remove ads.
- New: About section in Settings, with a link to this changelog.
- Improved: Clipboard sharing now uses long-polling instead of polling every 1.5 seconds, for faster sync and less network noise.

## 2.5.1 - 2026-10-24

Recent addresses and platform fixes.

- New: Recent connected addresses: add, reuse, and remove servers you connected to before.
- Improved: macOS minimum deployment target raised to 12.0.
- Fixed: Fixed a crash on iOS 27.
- Fixed: Fixed download service and UI issues on macOS.
- Fixed: Fixed a misaligned clipboard button.

## 2.4.5 - 2026-08-26

Clipboard sharing and direct macOS download.

- New: Clipboard sharing between devices, including links that open directly.
- New: Direct DMG download for macOS, alongside the Mac App Store.
- Improved: Better handling of very large file picking.
- Improved: Upload progress is now synced between host and client.
- Fixed: iOS clients now receive clipboard content from the host.
- Fixed: Fixed macOS DMG signing and notarization.

## 2.4.3 - 2026-08-07

Resumable downloads and more reliable file names.

- New: Resumable downloads using HTTP Range requests.
- Fixed: Files with percent-encoded names and URLs now download correctly.

## 2.4.0 - 2026-07-19

Faster transfers, PIN protection, and smarter connections.

- New: Cancel and retry uploads; the host shows the state of incoming files.
- New: PIN code authentication.
- New: IP address is detected automatically, with a fallback to the last saved address.
- Improved: Significantly improved transfer speed.

## 2.3.3 - 2026-05-26

Android storage access and desktop polish.

- Improved: Android hosting now uses the Storage Access Framework.
- Improved: The host only shows the latest dialog when opening a text file.
- Fixed: Photo and video permission handling aligned with Google Play policy.

## 2.3.0 - 2026-03-14

New downloader, upload progress, and macOS permissions.

- New: Upload progress percentage.
- Improved: New app icon.
- Improved: Switched to file_saver_ffi for saving files on both client and host.
- Improved: macOS permission check with a guided prompt dialog.
- Fixed: Fixed iOS file picker type filtering.

## 2.2.0 - 2026-01-17

Send text between devices.

- New: Send text between devices, with copy support for text content on the host.
- New: System tray support on desktop.
- Improved: Compatible with Flutter 3.38; Android Gradle migrated to Kotlin DSL.
- Fixed: QR overlay no longer gets trimmed on the right edge.

## 2.1.0 - 2023-08-12

iOS release and Flutter 3.10 UI.

- New: iOS release.
- New: Flutter 3.10 UI: bottom sheet drag handle on the file list and search anchor.
- Fixed: Fixed downloading files with spaces in the name on iOS.
- Fixed: Fixed download state not updating on iOS.
- Fixed: Fixed picking media files in client mode on iOS.
- Fixed: Fixed a crash when hosting files on iOS.

## 2.0.0

Windows and Linux, client and host modes.

- New: Windows and Linux releases.
- New: Switch between Client and Server modes.
- New: Connect by scanning a QR code.
- New: Drag and drop files on the upload screen.
- New: File type icons, file states, and server uptime.
- Fixed: Fixed wrong file URL, bad state when switching to Client mode, and overflow when resizing the desktop window.
