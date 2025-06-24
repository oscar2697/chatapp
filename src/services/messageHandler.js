import AIService from './AIService.js';
import appendToSheet from './googleSheetCredentials.js';
import whatsappService from './whatsappService.js';

class MessageHandler {
    constructor() {
        this.appointmentState = {}
        this.assistantState = {}
    }

    async handleIncomingMessage(message, senderInfo) {
        if (message?.type === 'text') {
            const incomingMessage = message.text.body.toLowerCase().trim()

            if (this.isGreeting(incomingMessage)) {
                await this.sendWelcomeMessage(message.from, message.id, senderInfo)
                await this.sendWelcomeMenu(message.from)
            } else if (["video", "audio", "image", "document"].includes(incomingMessage)) {
                await this.sendMedia(message.from, incomingMessage);
            } else if (this.appointmentState[message.from]) {
                await this.handleAppointmentFlow(message.from, incomingMessage);
            } else if (this.assistantState[message.from]) {
                await this.handleAssistantFlow(message.from, incomingMessage);
            } else {
                await whatsappService.sendMessage(
                    message.from,
                    'Por favor, selecciona una opción del menú para comenzar. Si necesitas ayuda, estoy aquí para asistirte. 🚗'
                );
                await this.sendWelcomeMenu(message.from);
            }

            await whatsappService.markAsRead(message.id)
        } else if (message?.type === 'interactive') {
            const option = message?.interactive?.button_reply?.id || message?.interactive?.button_reply?.title
            const selectedOption = option ? option.toLowerCase().trim() : ''

            await this.handleMenuOption(message.from, selectedOption)
            await whatsappService.markAsRead(message.id)
        }
    }

    isGreeting(message) {
        const greetings = ["hola", "hello", "hi", "buenas tardes"]
        return greetings.includes(message)
    }

    getSenderName(senderInfo) {
        return senderInfo.profile?.name || senderInfo.wa_id
    }

    async sendWelcomeMessage(to, messageId, senderInfo) {
        const name = this.getSenderName(senderInfo)
        const firstName = name.split(' ')[0]
        const welcomeMessage = `Hola ${firstName}, Bienvenido a PremiumCar, tu espacio para comprar y vender autos.`;
        await whatsappService.sendMessage(to, welcomeMessage, messageId)
    }

    async sendWelcomeMenu(to) {
        const menuMessage = '¿En qué puedo ayudarte hoy?'
        const buttons = [
            { type: 'reply', reply: { id: 'option_1', title: 'Comprar y Vender' } },
            { type: 'reply', reply: { id: 'option_2', title: 'Consultar' } },
            { type: 'reply', reply: { id: 'option_3', title: 'Cotiza y visita' } },
        ]

        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons)
    }

    async handleMenuOption(to, selectedOption) {
        let response

        switch (selectedOption) {
            case 'option_1':
                response = '¿Qué tipo de auto estás buscando o vendiendo?';
                break;
            case 'option_2':
                this.assistantState[to] = { step: 'question' }
                response = '¿Cuál es tu consulta?';
                break;
            case 'option_3':
                this.appointmentState[to] = { step: 'name' }
                response = 'Perfecto, iniciemos el proceso. ¿Podrías indicarme tu nombre completo, por favor?';
                break;

            default:
                response = 'Opción no válida. Por favor, elige una opción del menú.';
                break;
        }

        await whatsappService.sendMessage(to, response)
    }

    mediaActions = {
        audio: {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac',
            caption: "Bienvenido 🔉",
        },
        image: {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png',
            caption: "¡Esta es una imagen! 🏞️",
        },
        video: {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4',
            caption: "¡Este es un video! 🎥",
        },
        document: {
            url: 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf',
            caption: "¡Este es un PDF! 📄",
        },
    };

    async sendMedia(to, media) {
        const { url, caption } = this.mediaActions[media]

        await whatsappService.sendMediaMessage(to, media, url, caption)
    }

    completeAppointmentFlow(to) {
        const appointment = this.appointmentState[to]
        delete this.appointmentState[to]

        const userData = [
            to,
            appointment.name,
            appointment.carType,
            appointment.visitType,
            appointment.preferredDate,
            new Date().toISOString()
        ]

        appendToSheet(userData)

        return (
            `Gracias por tu interés, ${appointment.name}.\n\n` +
            `📌 Hemos registrado tu solicitud de *${appointment.visitType}* para un *${appointment.carType}* ` +
            `el día *${appointment.preferredDate}*.\n\n` +
            `🧑‍💼 Nos pondremos en contacto contigo muy pronto.\n\n` +
            `Si tienes alguna otra pregunta, no dudes en escribirnos. 🚗`
        )
    }

    async handleAppointmentFlow(to, message) {
        const state = this.appointmentState[to]

        if (!state || !state.step) {
            await whatsappService.sendMessage(
                to,
                'Parece que aún no has iniciado una solicitud. Por favor selecciona *"Cotiza y visita"* en el menú principal.'
            );
            return;
        }

        let response

        switch (state.step) {
            case 'name':
                state.name = message
                state.step = 'carType'
                response = 'Gracias, ¿Qué tipo de vehículo te interesa? (SUV, sedán, camioneta, etc.)';
                break;
            case 'carType':
                state.carType = message
                state.step = 'visitType'
                response = '¿Deseas agendar una visita al concesionario o prefieres una cotización en línea?';
                break;
            case 'visitType':
                state.visitType = message
                state.step = 'preferredDate'
                response = '¿Qué día te gustaría agendar la cita o recibir la información?';
                break;
            case 'preferredDate':
                state.preferredDate = message
                response = this.completeAppointmentFlow(to)
                break;

            default:
                response = 'Ha ocurrido un error en el flujo. Reinicia el proceso por favor.';
                delete this.appointmentState[to];
                break;
        }

        await whatsappService.sendMessage(to, response)
    }

    async handleAssistantFlow(to, message) {
        const state = this.assistantState[to]
        let response

        const menuMessage = '¿La respuesta fue útil? ¿Necesitas algo más?'
        const buttons = [
            { type: 'reply', reply: { id: 'option_4', title: 'Más Información' } },
            { type: 'reply', reply: { id: 'option_5', title: 'No, gracias' } },
        ]

        if (state.step === 'question') {
            response = await AIService(message)
        }

        delete this.assistantState[to]

        await whatsappService.sendMessage(to, response)
        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons)
    }
}

export default new MessageHandler()