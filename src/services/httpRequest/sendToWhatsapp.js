import axios from "axios";
import config from '../../config/env.js';

const { BASE_URL, API_VERSION, BUSINESS_PHONE, API_TOKEN } = config

const sendToWhatsApp = async (data) => {
    const baseUrl = `${BASE_URL}/${API_VERSION}/${BUSINESS_PHONE}/messages`
    const headers = {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios({
            method: 'POST',
            url: baseUrl,
            headers: headers,
            data,
        })

        return response.data
    } catch (error) {
        console.error(error)
    }
};

export default sendToWhatsApp