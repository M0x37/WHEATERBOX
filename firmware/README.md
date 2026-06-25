# Firmware

ESP32-C3 firmware for the TEMPBOX temperature station.

## Setup

1. Install **Arduino IDE** with ESP32 board support (Board: `ESP32-C3 Dev Module`).
2. Install required libraries via Library Manager:
   - ArduinoJson
   - Adafruit AHTX0
   - Adafruit BMP280 Library
   - Adafruit Unified Sensor
3. Copy `config.example.h` to `config.h` and set your WiFi credentials.
4. Open `CODE.ino` and upload to the ESP32-C3.

## Power Saving (Deep Sleep)

The ESP32 wakes every **30 minutes**, serves HTTP requests for ~10 seconds, then enters deep sleep. During sleep, consumption drops to ~5 µA (LEDs off, WiFi disconnected).

With a 2000 mAh battery: ~240 days runtime.

## API

The server listens on port 80 while awake:

| Method | Path | Description |
|--------|------|-------------|
| `GET /` | HTTP | Returns `{"temp": 23.5, "humidity": 45.2, "pressure": 1013.2}` |

CORS is enabled (`Access-Control-Allow-Origin: *`) for cross-origin requests.

The app will show "ESP32 not found" during sleep – data updates every 30 minutes.
