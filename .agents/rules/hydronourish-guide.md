---
trigger: always_on
---

# HydroNourish Workspace Rules

## Architecture & Framework
- Framework: ESP32 Arduino / PlatformIO (`main.cpp`).
- Microcontroller: ESP32 / ESP32-CAM. Respect hardware peripheral constraints (flash pin strapping, memory limits, and ADC2/Wi-Fi conflicts).

## Coding Guidelines
- Write clean, non-blocking code. Prefer `millis()` timing state machines over blocking `delay()` calls so camera streaming and sensor reads don't freeze.
- Prioritize memory safety: use static buffers where practical and minimize dynamic heap allocations to avoid memory fragmentation.
- When referencing GPIO pins, always look for existing `#define` or `constexpr` pin mappings in the project instead of inventing new pin assignments.
- Ensure any hardware drivers (camera, load cell/HX711, servos, relays) include basic sanity checks or timeout fallbacks.

## Output Expectations
- Provide concise, drop-in replacement snippets or precise functions rather than rewriting entire files unnecessarily.
- When introducing a new library or dependency, explicitly note what needs to be added to `platformio.ini` or installed via Arduino Library Manager.
