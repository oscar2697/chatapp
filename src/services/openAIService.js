import { createGroq } from '@ai-sdk/groq'
import { generateText } from "ai";
import config from "../config/env.js";

const groqClient = createGroq({
    apiKey: config.GROQ_API_KEY,
});

const openAIService = async (message) => {
    try {
        const { text } = await generateText({
            model: groqClient('gemma2-9b-it'),
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente virtual especializado en compra y venta de vehículos para la concesionaria "PremiumCar". Tu objetivo es resolver preguntas relacionadas con autos nuevos, usados, precios, procesos de cotización, financiamiento, visitas al concesionario y trámites de venta. Responde siempre con información clara, precisa y en lenguaje sencillo, como si fueras un bot conversacional. No inicies saludos ni conversaciones, no hagas preguntas, no generes texto innecesario. Si el usuario desea agendar una cita o cotización, recomiéndale usar el botón del menú principal. Si la consulta es muy específica o requiere intervención humana, indícale que un asesor le escribirá pronto.'
                }, {
                    role: 'user',
                    content: message
                }
            ],
        })

        return text
    } catch (error) {
        console.error(error)
    }
}

export default openAIService