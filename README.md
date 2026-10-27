# PostureGuard — Smart IoT Posture Monitoring System

> An intelligent, IoT-powered ergonomic health companion that provides real-time neck and back posture tracking, personalized spine calibration, and predictive slouch forecasting using deep learning.

---

## 🌟 Overview

Prolonged desk work and poor posture lead to chronic spine strain, cervical stiffness, and "Text Neck." Most posture trackers are strictly **reactive**—vibrating only after a slouch has already caused physical stress.

**PostureGuard** changes this paradigm by combining wearable IoT hardware with machine learning to:
1. **Predict slouching before it happens** using an LSTM neural network analyzing fatigue and micro-tilt patterns.
2. **Personalize posture thresholds** with a 5-second calibration baseline matching the user's natural spinal curve.
3. **Protect privacy** by supporting direct offline **Web Bluetooth (BLE)** streaming directly to the browser.
4. **Support accessibility** with lateral head-tilt detection and caretaker alert escalation for wheelchair and disabled users.

---

## 🚀 Key Features

* **Real-Time 3D Angle Tracking:** Continuously monitors neck tilt (pitch) and spinal curvature (roll) using an MPU6050 6-axis IMU.
* **Preemptive Slouch Forecasting (LSTM):** Sequence-based deep learning model analyzes rolling movement windows to predict slouch probability up to 5 minutes in advance.
* **Adaptive Baseline Calibration:** Calibrates against your upright posture instead of enforcing generic, rigid angles.
* **Dual-Mode Connectivity:**
  * **Web Bluetooth (BLE):** Direct, driverless connection to web browsers via Web Bluetooth API for complete offline privacy.
  * **Wi-Fi WebSockets:** High-throughput streaming to the local FastAPI server for continuous database logging and model training.
* **Accessibility & Caretaker Support:** Detects lateral (left/right) head tilt and triggers an onboard buzzer or notification system for assisted care.
* **AI Health Chatbot & Analytics:** Local wellness companion offering stretching exercises, risk scores, fatigue threshold discovery, and historical trend analysis.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Wearable Hardware** | ESP32 Dev Module, MPU6050 (Accelerometer/Gyroscope), Vibration Motor, Buzzer |
| **Firmware** | C++ (Arduino IDE), Adafruit MPU6050, WebSocketsClient, BLEDevice |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| **Backend & AI** | Python 3, FastAPI, SQLite, TensorFlow/Keras (LSTM), Uvicorn |

---

## 🔌 Hardware Circuit Diagram

| Component | ESP32 Pin | Notes |
| :--- | :--- | :--- |
| **MPU6050 SDA** | `GPIO 21` | I2C Data |
| **MPU6050 SCL** | `GPIO 22` | I2C Clock |
| **MPU6050 VCC / GND** | `3.3V / GND` | Power Supply |
| **Vibration Motor** | `GPIO 13` | Tactile Posture Alerts |
| **Buzzer** | `GPIO 12` | Caretaker / Disability Alerts |

---

## 🏁 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 to v3.13)
* **Arduino IDE** (if modifying/uploading firmware to ESP32)

---

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   * Backend Status: [http://localhost:8000](http://localhost:8000)
   * Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup
1. In a new terminal, navigate to the project root:
   ```bash
   cd Posture-main
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. ESP32 Firmware Upload
1. Open [`firmware/posture_bluetooth.ino`](firmware/posture_bluetooth.ino) (for BLE mode) or [`firmware/posture_iot.ino`](firmware/posture_iot.ino) (for Wi-Fi mode) in Arduino IDE.
2. Select your ESP32 board and COM port.
3. If using Wi-Fi mode, update your Wi-Fi SSID, password, and computer IP address in the configuration section.
4. Click **Upload**.

---

## 📂 Project Structure

```text
Posture-Monitoring-System/
├── backend/
│   ├── main.py                 # FastAPI backend server & WebSocket handler
│   ├── auth.py                 # User authentication & profile manager
│   ├── posture_predictor.py    # LSTM deep learning slouch forecasting model
│   ├── pattern_miner.py        # Statistical pattern analysis & fatigue detection
│   ├── ml_insights.py          # Personalized posture risk scoring engine
│   ├── chatbot.py              # Context-aware AI health companion
│   ├── baseline_learning.py    # Personalized posture calibration logic
│   └── requirements.txt        # Python backend dependencies
├── components/                 # React UI views (Dashboard, Live, Insights, Chatbot, etc.)
├── firmware/
│   ├── posture_bluetooth.ino   # BLE firmware with Web Bluetooth protocol
│   ├── posture_iot.ino         # Wi-Fi WebSocket firmware
│   └── hardware_test.ino       # Diagnostics script for MPU6050 sensor & pins
├── hooks/                      # Custom React hooks (useIoTData, useBLEData, useNotifications)
├── App.tsx                     # Main application routing & state management
├── package.json                # Frontend package configuration
└── vite.config.ts              # Vite server & build configuration
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
