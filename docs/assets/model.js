(function (root) {
  'use strict';

  const training = [
    { label: 'balanced', points: [[24, 45], [24.5, 54], [25, 50], [25.5, 57], [26, 48], [26.5, 53]] },
    { label: 'warm', points: [[30, 44], [31, 51], [32, 55], [33, 48], [34, 60], [34.5, 52]] },
    { label: 'humid', points: [[24, 70], [25, 76], [26, 68], [26.5, 79], [27.5, 73], [28, 82]] },
  ];
  const labels = {
    balanced: { title: 'สบาย', description: 'ใกล้เคียงตัวอย่างห้องที่อุณหภูมิและความชื้นอยู่ในช่วงกลาง' },
    warm: { title: 'ร้อน', description: 'ใกล้เคียงตัวอย่างที่อุณหภูมิสูงและความชื้นอยู่ในช่วงกลาง' },
    humid: { title: 'อับชื้น', description: 'ใกล้เคียงตัวอย่างที่มีความชื้นสัมพัทธ์สูง' },
  };
  const samples = training.flatMap(({ label, points }) => points.map(([temperature, humidity]) => (
    { label, temperature, humidity }
  )));

  function standardize(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return value => (value - mean) / Math.sqrt(variance);
  }

  const scaleTemperature = standardize(samples.map(sample => sample.temperature));
  const scaleHumidity = standardize(samples.map(sample => sample.humidity));

  function classify({ temperature, humidity }) {
    const neighbors = samples
      .map(sample => ({
        ...sample,
        distance: Math.hypot(
          scaleTemperature(temperature) - scaleTemperature(sample.temperature),
          scaleHumidity(humidity) - scaleHumidity(sample.humidity),
        ),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 3);
    const votes = new Map();
    for (const { label } of neighbors) {
      votes.set(label, (votes.get(label) ?? 0) + 1);
    }
    // Stable sorting keeps the closest neighbor first when three classes tie.
    const [label, count] = [...votes].sort((left, right) => right[1] - left[1])[0];
    return { label, count, neighbors };
  }

  function parseLine(line) {
    let reading;
    try {
      reading = JSON.parse(line);
    } catch {
      return null;
    }
    if (reading?.error === 'sensor_not_found' || reading?.error === 'invalid_reading') {
      return { error: reading.error };
    }
    if (!Number.isFinite(reading?.temperature) || !Number.isFinite(reading?.humidity) ||
        reading.temperature < -40 || reading.temperature > 120 ||
        reading.humidity < 0 || reading.humidity > 100) {
      return null;
    }
    return { temperature: reading.temperature, humidity: reading.humidity };
  }

  const api = { classify, labels, parseLine, samples };
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.MicroclimateModel = api;
  }
}(globalThis));
