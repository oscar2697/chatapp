import AIService from './AIService.js';
import appendToSheet from './googleSheetCredentials.js';
import whatsappService from './whatsappService.js';

class MessageHandler {
    constructor() {
        this.appointmentState = {}
        this.assistantState = {}
        this.sellState = {}
    }

    async handleIncomingMessage(message, senderInfo) {
        if (message?.type === 'text') {
            const incomingMessage = message.text.body.toLowerCase().trim();

            if (this.isGreeting(incomingMessage)) {
                await this.sendWelcomeMessage(message.from, message.id, senderInfo);
                await this.sendWelcomeMenu(message.from);
            } else if (["video", "audio", "image", "document"].includes(incomingMessage)) {
                await this.sendMedia(message.from, incomingMessage);
            } else if (this.sellState[message.from]) {
                await this.handleSellFlow(message.from, incomingMessage);
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
            await whatsappService.markAsRead(message.id);
        } else if (message?.type === 'interactive') {
            const option = message?.interactive?.button_reply?.id || message?.interactive?.button_reply?.title;
            const selectedOption = option ? option.toLowerCase().trim() : '';

            await this.handleMenuOption(message.from, selectedOption);
            await whatsappService.markAsRead(message.id);
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
            { type: 'reply', reply: { id: 'option_sell', title: 'Comprar y Vender' } },
            { type: 'reply', reply: { id: 'option_consult', title: 'Consultar' } },
            { type: 'reply', reply: { id: 'option_visit', title: 'Cotiza y visita' } },
        ]

        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons)
    }

    async handleMenuOption(to, selectedOption) {
        let response

        switch (selectedOption) {
            case 'option_sell':
                this.sellState[to] = { step: 'askType' }
                response = '¿Quieres *vender* o *comprar* un auto?';
                break;
            case 'option_consult':
                this.assistantState[to] = { step: 'question' }
                response = '¿Cuál es tu consulta?';
                break;
            case 'option_visit':
                this.appointmentState[to] = { step: 'name' }
                response = 'Perfecto, iniciemos el proceso. ¿Podrías indicarme tu nombre completo, por favor?';
                break;
            case 'option_contact':
                response = 'Si necesitas más información o  asistencia, por favor contáctanos directamente.';
                await this.sendContact(to);
                break;
            case 'option_no_thanks':
                response = '¡Gracias por tu interés! Si necesitas algo más, no dudes en preguntar. 🚗';
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
            )
            return
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
                response = this.completeAppointmentFlow(to) +
                    '\n\n📍 Te enviamos la ubicación en caso de que sea necesario.';
                delete this.appointmentState[to];
                await whatsappService.sendMessage(to, response);
                await this.sendLocation(to);
                return;

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

        const menuMessage = '¿Necesitas algo más?'
        const buttons = [
            { type: 'reply', reply: { id: 'option_contact', title: 'Más Información' } },
            { type: 'reply', reply: { id: 'option_no_thanks', title: 'No, gracias' } },
        ]

        if (state.step === 'question') {
            response = await AIService(message)
        }

        delete this.assistantState[to]

        await whatsappService.sendMessage(to, response)
        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons)
    }

    async handleSellFlow(to, message) {
        const state = this.sellState[to]

        if (state.step === 'askType') {
            const lowerMsg = message.toLowerCase().trim()

            if (lowerMsg === 'comprar' || lowerMsg === 'vender') {
                state.type = lowerMsg
                state.step = 'askCar'
                await whatsappService.sendMessage(
                    to,
                    '¿Qué auto deseas vender o comprar? Por favor, indícalo con marca y modelo.'
                )
            } else {
                await whatsappService.sendMessage(
                    to,
                    'Por favor, responde con "comprar" o "vender".'
                )
            }

            return
        }

        if (state.step === 'askCar') {
            const loweMsg = message.toLowerCase().trim();

            if (loweMsg === 'comprar' || loweMsg === 'vender') {
                await whatsappService.sendMessage(
                    to,
                    'Por favor, indícanos la marca y modelo del auto que deseas vender o comprar. Ejemplo: "Toyota Corolla 2018".'
                )

                return
            }

            state.car = message;
            state.step = 'done'

            const sheetName = state.type === 'comprar' ? 'AutoCompra' : 'AutoVenta'
            const userData = [
                to,
                state.type,
                state.car,
                new Date().toISOString()
            ]
            appendToSheet(userData, sheetName)

            await whatsappService.sendMessage(
                to,
                `¡Perfecto! Para continuar con la revisión del auto "${state.car}", te comparto la ubicación de nuestro concesionario.`
            )

            await this.sendLocation(to)
            delete this.sellState[to]
        }
    }

    async sendContact(to) {
        const contact = {
            emails: [
                {
                    email: 'lindooscar635@gmail.com',
                    type: 'WORK',
                }
            ],
            name: {
                formatted_name: 'PremiumCar',
                first_name: 'Premium',
                last_name: 'Car',
            },
            org: {
                company: 'PremiumCar',
                department: 'Atención al Cliente',
                title: 'Asesor de Ventas',
            },
            phones: [
                {
                    phone: '+593998564165',
                    type: 'WORK',
                }
            ],
            urls: [
                {
                    url: 'https://www.tiktok.com/@premiumcar33?is_from_webapp=1&sender_device=pc',
                    type: 'WORK',
                }
            ]
        }

        await whatsappService.sendContactMessage(to, contact)
    }

    async sendLocation(to) {
        const latitude = -0.22985
        const longitude = -78.52495
        const name = 'PremiumCar Concesionario'
        const address = 'Av. Amazonas N34-123, Ambato, Ecuador'

        await whatsappService.sendLocationMessage(to, latitude, longitude, name, address)
    }
}

export default new MessageHandler()