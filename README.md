# 🚗 PremiumCar Chatbot

An intelligent WhatsApp assistant designed for automotive dealerships, built with Node.js, the WhatsApp Cloud API, OpenAI GPT, and Google Sheets API. It allows clients to schedule appointments, request quotes, and ask vehicle-related questions—all through a streamlined chat experience.

---

## 📌 Features

* 🤖 Smart WhatsApp chatbot using Groq's Gemma AI model
* 📆 Schedule appointments or request online quotes
* 📊 Google Sheets integration for real-time data registration
* 🧠 Conversational AI assistant for customer inquiries

---

## 🚀 Technologies Used

* Node.js
* WhatsApp Cloud API
* Google Sheets API
* AI SDK (Groq - Gemma2-9b-it)
* Axios

---

## 📁 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/chatapp.git
cd chatapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file at the root of your project with the following variables:

```env
WHATSAPP_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
OPENAI_API_KEY=your_openai_api_key
GOOGLE_SHEET_ID=your_google_sheet_id
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

### 4. Google Sheets Credentials

Create a folder named `credentials` at the root, and place a `credentials.json` file inside.
This file must follow the structure provided by Google Cloud when creating a Service Account.

```bash
mkdir credentials
# Add your credentials.json inside the folder
```

**Important:**

* Add this folder to your `.gitignore` to prevent committing sensitive data:

```bash
/credentials/
```

---

## ✅ Example Features in Action

### Appointment saved to Google Sheets

```plaintext
📌 Request: Online quote for a SUV on June 25th
✔️ Data saved to Google Sheets automatically
```

### Assistant Response with AI

```plaintext
Client: ¿Qué documentos necesito para vender mi auto?
AI: Para vender tu auto necesitas cédula, matrícula y el contrato de compraventa...
```

---

## 🧠 AI Integration

This project uses `gemma2-9b-it`, a conversational model currently served via **Groq** using the [AI SDK](https://www.npmjs.com/package/aisdk). The integration powers the assistant to respond to customer questions in natural language.

In future iterations, we plan to switch to **OpenRouter** to experiment with a wider variety of AI models, such as Mistral, Claude, and others, based on flexibility and availability.

> ⚠️ Note: The assistant is still under testing. In cases where users do not follow the button-based flow, fallback messages may appear. Improved natural conversation handling is in the roadmap.

### ✨ AI Prompt Configuration

Example prompt used to guide the chatbot response logic:

```js
const { text } = await generateText({
  model: groqClient('gemma2-9b-it'),
  messages: [
    {
      role: 'system',
      content: `
                        Eres un asistente virtual especializado en compra y venta de vehículos 
                        para la concesionaria "PremiumCar". Tu objetivo es resolver preguntas 
                        relacionadas con autos nuevos, usados, precios, procesos de cotización, 
                        financiamiento, visitas al concesionario y trámites de venta.

                        Responde siempre con información clara, precisa y en lenguaje sencillo, 
                        como si fueras un bot conversacional.

                        No inicies saludos ni conversaciones, no hagas preguntas, no generes texto innecesario.

                        Si el usuario desea agendar una cita o cotización, recomiéndale usar el botón del menú principal.

                        Si la consulta es muy específica o requiere intervención humana, indícale 
                        que un asesor le escribirá pronto.
                    `
                }, {
      role: 'user',
      content: message
    }
  ],
});
```

---

## ✨ Credits

Made with passion by [@oscar2697](https://github.com/oscar2697). Special thanks to the OpenAI, Meta, and Google APIs.

---

## 🛡️ Disclaimer

This project is for educational and portfolio purposes. Be sure to secure your API keys and do not expose your `credentials.json` publicly.
