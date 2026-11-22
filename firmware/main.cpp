#include <Adafruit_HTS221.h>
#include <Arduino.h>
#include <Wire.h>
#include <cmath>

namespace {
constexpr int sensorSda = 41;
constexpr int sensorScl = 40;
constexpr unsigned long sampleIntervalMs = 2000;

Adafruit_HTS221 sensor;
bool sensorReady;
}  // namespace

void setup() {
    Serial.begin(115200);
    sensorReady = Wire.begin(sensorSda, sensorScl, 100000) && sensor.begin_I2C();
    if (!sensorReady) {
        Serial.println("{\"error\":\"sensor_not_found\"}");
    }
}

void loop() {
    if (!sensorReady) {
        delay(sampleIntervalMs);
        Serial.println("{\"error\":\"sensor_not_found\"}");
        return;
    }

    sensors_event_t humidity{};
    sensors_event_t temperature{};
    if (sensor.getEvent(&humidity, &temperature) &&
        std::isfinite(temperature.temperature) && std::isfinite(humidity.relative_humidity) &&
        humidity.relative_humidity >= 0 && humidity.relative_humidity <= 100) {
        Serial.printf("{\"temperature\":%.2f,\"humidity\":%.2f}\n",
                      temperature.temperature, humidity.relative_humidity);
    } else {
        Serial.println("{\"error\":\"invalid_reading\"}");
    }
    delay(sampleIntervalMs);
}
