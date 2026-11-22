'use strict';

const { classify, labels, parseLine, samples } = MicroclimateModel;
const byId = id => document.getElementById(id);
const demoButton = byId('demo-mode');
const serialButton = byId('serial-mode');
const scenario = byId('scenario');
const status = byId('connection-status');
const chart = byId('chart');
const context = chart.getContext('2d');
const format = new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const demoValues = { balanced: [25.4, 51.2], warm: [32.6, 52.5], humid: [26.1, 76.8] };
const demoMessage = 'ข้อมูลจำลอง · อัปเดตทุก 2 วินาที';
const readings = [];
let sampleNumber = 0;
let demoStep = 0;
let activeConnection = null;
let lastBoardData = 0;

function setStatus(message, state = 'normal') {
  if (status.textContent === message && status.dataset.state === state) return;
  status.dataset.state = state;
  status.replaceChildren(document.createElement('span'), document.createTextNode(message));
}

function renderTable(tbody, rows) {
  tbody.replaceChildren(...rows.map(values => {
    const row = document.createElement('tr');
    for (const value of values) {
      const cell = row.insertCell();
      cell.textContent = value;
    }
    return row;
  }));
}

function renderReading(reading) {
  byId('temperature').textContent = reading ? format.format(reading.temperature) : '–';
  byId('humidity').textContent = reading ? format.format(reading.humidity) : '–';
  byId('neighbors').replaceChildren();
  if (!reading) {
    delete byId('result-card').dataset.label;
    byId('result').textContent = '–';
    byId('votes').textContent = 'รอข้อมูล';
    byId('reason').textContent = 'เมื่อได้รับข้อมูล โมเดลจะแสดงตัวอย่างที่ใกล้ที่สุด';
    return;
  }
  const { label, count, neighbors } = classify(reading);
  byId('result-card').dataset.label = label;
  byId('result').textContent = labels[label].title;
  byId('votes').textContent = count === 1 ? 'คะแนนเสมอ · เลือกจุดที่ใกล้ที่สุด' : count + ' / 3 คะแนนโหวต';
  byId('reason').textContent = labels[label].description;
  for (const neighbor of neighbors) {
    const row = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = labels[neighbor.label].title;
    const values = document.createElement('span');
    values.textContent = format.format(neighbor.temperature) + ' °C · ' + format.format(neighbor.humidity) + ' %RH';
    row.append(title, values);
    byId('neighbors').append(row);
  }
}

function drawChart() {
  const { width, height } = chart.getBoundingClientRect();
  if (!context || !width || !height) return;
  const density = window.devicePixelRatio || 1;
  chart.width = Math.round(width * density);
  chart.height = Math.round(height * density);
  context.scale(density, density);
  const left = 32;
  const right = width - 34;
  const top = 18;
  const bottom = height - 30;
  const colors = ['#087059', '#3c64bd'];
  const temperatures = readings.map(reading => reading.temperature);
  const tempMin = Math.floor(Math.min(20, ...temperatures) / 5) * 5;
  const tempMax = Math.ceil(Math.max(40, ...temperatures) / 5) * 5;
  const x = index => readings.length === 1 ? (left + right) / 2 : left + index / (readings.length - 1) * (right - left);
  const y = fraction => bottom - fraction * (bottom - top);

  context.font = '12px system-ui, sans-serif';
  context.textBaseline = 'middle';
  for (let step = 0; step <= 4; step++) {
    const fraction = step / 4;
    const line = y(fraction);
    context.strokeStyle = '#dce7e5';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, line);
    context.lineTo(right, line);
    context.stroke();
    context.fillStyle = colors[0];
    context.textAlign = 'right';
    context.fillText(Math.round(tempMin + fraction * (tempMax - tempMin)), left - 6, line);
    context.fillStyle = colors[1];
    context.textAlign = 'left';
    context.fillText(fraction * 100, right + 6, line);
  }

  const series = [
    reading => (reading.temperature - tempMin) / (tempMax - tempMin),
    reading => reading.humidity / 100,
  ];
  series.forEach((fraction, seriesIndex) => {
    context.strokeStyle = colors[seriesIndex];
    context.fillStyle = colors[seriesIndex];
    context.lineWidth = 2.5;
    context.lineJoin = 'round';
    context.beginPath();
    readings.forEach((reading, index) => context.lineTo(x(index), y(fraction(reading))));
    context.stroke();
    for (const [index, reading] of readings.entries()) {
      context.beginPath();
      context.arc(x(index), y(fraction(reading)), index === readings.length - 1 ? 4 : 2, 0, Math.PI * 2);
      context.fill();
    }
  });
  context.fillStyle = '#4f666c';
  context.textAlign = 'center';
  context.fillText(readings.length ? 'ลำดับตัวอย่าง' : 'รอข้อมูลจากบอร์ด', (left + right) / 2, height - 11);
}

function refresh() {
  renderReading(readings.at(-1));
  drawChart();
  renderTable(byId('readings-table'), readings.slice(-8).reverse().map(reading => [
    reading.number, format.format(reading.temperature), format.format(reading.humidity),
  ]));
}

function addReading(reading) {
  readings.push({ ...reading, number: ++sampleNumber });
  if (readings.length > 24) readings.shift();
}

function clearReadings() {
  readings.length = 0;
  sampleNumber = 0;
}

function simulate() {
  const [temperature, humidity] = demoValues[scenario.value];
  addReading({
    temperature: temperature + Math.sin(demoStep * .78) * 1.2,
    humidity: humidity + Math.cos(demoStep * .68 + 1.1) * 3,
  });
  demoStep++;
}

function startDemo(message = demoMessage) {
  clearReadings();
  demoStep = 0;
  for (let index = 0; index < 10; index++) simulate();
  demoButton.setAttribute('aria-pressed', 'true');
  serialButton.setAttribute('aria-pressed', 'false');
  serialButton.textContent = 'เชื่อมต่อบอร์ด';
  byId('scenario-control').hidden = false;
  setStatus(message, message === demoMessage ? 'normal' : 'warning');
  refresh();
}

function handleSerialLine(line) {
  const reading = parseLine(line);
  if (!reading) return;
  lastBoardData = Date.now();
  if (reading.error) {
    const message = reading.error === 'sensor_not_found'
      ? 'บอร์ดรายงานว่าไม่พบ HTS221'
      : 'บอร์ดรายงานว่าอ่านเซนเซอร์ไม่สำเร็จ';
    setStatus(message, 'warning');
    return;
  }
  setStatus('รับข้อมูลจริงจาก Cucumber');
  addReading(reading);
  refresh();
}

async function readSerial(connection) {
  const reader = connection.port.readable.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  connection.reader = reader;
  try {
    while (!connection.stopping) {
      const { value, done } = await reader.read();
      if (done) break;
      const lines = (pending + decoder.decode(value, { stream: true })).split('\n');
      pending = lines.pop();
      for (const line of lines) handleSerialLine(line.trim());
      if (pending.length > 512) pending = '';
    }
  } finally {
    reader.releaseLock();
  }
}

async function stopSerial(message) {
  const connection = activeConnection;
  if (!connection || connection.stopping) return;
  connection.stopping = true;
  serialButton.disabled = true;
  try {
    await connection.reader?.cancel().catch(() => {});
    await connection.reading.catch(() => {});
    await connection.port.close();
  } catch {
    message = 'พอร์ตถูกตัดการเชื่อมต่อ · แสดงข้อมูลจำลอง';
  } finally {
    activeConnection = null;
    serialButton.disabled = false;
    startDemo(message);
  }
}

async function toggleSerial() {
  if (activeConnection) {
    await stopSerial();
    return;
  }
  if (!window.isSecureContext || !navigator.serial) {
    setStatus('ใช้ Chrome หรือ Edge บนพีซีผ่าน HTTPS หรือ localhost · ข้อมูลจำลอง', 'warning');
    return;
  }
  serialButton.disabled = true;
  let port;
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
  } catch (error) {
    const message = error.name === 'NotFoundError'
      ? 'ยังไม่ได้เลือกพอร์ต · แสดงข้อมูลจำลอง'
      : 'เปิดพอร์ตไม่ได้ ลองปิด Serial Monitor แล้วเชื่อมต่ออีกครั้ง · ข้อมูลจำลอง';
    setStatus(message, 'warning');
    return;
  } finally {
    serialButton.disabled = false;
  }

  const connection = { port, stopping: false };
  activeConnection = connection;
  demoButton.setAttribute('aria-pressed', 'false');
  serialButton.setAttribute('aria-pressed', 'true');
  serialButton.textContent = 'ตัดการเชื่อมต่อ';
  byId('scenario-control').hidden = true;
  clearReadings();
  refresh();
  lastBoardData = Date.now();
  setStatus('เชื่อมต่อแล้ว · กำลังรอข้อมูลจากบอร์ด');
  connection.reading = readSerial(connection);
  function handleClosedPort() {
    if (!connection.stopping) void stopSerial('การเชื่อมต่อสิ้นสุด · แสดงข้อมูลจำลอง');
  }
  void connection.reading.then(handleClosedPort, handleClosedPort);
}

demoButton.addEventListener('click', () => {
  if (activeConnection) void stopSerial();
  else startDemo();
});
serialButton.addEventListener('click', toggleSerial);
scenario.addEventListener('change', () => startDemo());

const training = document.createElement('table');
training.innerHTML = '<thead><tr><th scope="col">°C</th><th scope="col">%RH</th><th scope="col">ป้าย</th></tr></thead><tbody></tbody>';
renderTable(training.tBodies[0], samples.map(({ temperature, humidity, label }) => [
  format.format(temperature), format.format(humidity), labels[label].title,
]));
byId('training-table').append(training);

const quiz = byId('quiz');
quiz.addEventListener('submit', event => {
  event.preventDefault();
  const answer = new FormData(quiz).get('vote');
  byId('quiz-result').textContent = answer === 'humid'
    ? 'ถูกต้อง อับชื้นชนะด้วยคะแนน 2 จาก 3'
    : 'ลองใหม่ เลือกป้ายที่ได้เสียงโหวตมากที่สุด';
});
quiz.addEventListener('change', () => { byId('quiz-result').textContent = ''; });

new ResizeObserver(drawChart).observe(chart);
startDemo();
setInterval(() => {
  if (!activeConnection) {
    simulate();
    refresh();
  } else if (!activeConnection.stopping && Date.now() - lastBoardData > 7000) {
    setStatus('ยังไม่มีข้อมูลใหม่ · ตรวจสาย USB และเฟิร์มแวร์', 'warning');
  }
}, 2000);
