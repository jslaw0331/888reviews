
const axios = require('axios');
require('dotenv').config();

async function testProxy() {
    try {
        console.log('Testing proxy connection to Strapi...');
        console.log('URL:', process.env.STRAPI_API_URL);
        console.log('Token (first 10 chars):', process.env.STRAPI_API_TOKEN?.substring(0, 10));
        
        const targetUrl = `${process.env.STRAPI_API_URL}/api/casinos?populate=*`;
        console.log('Target URL:', targetUrl);

        const response = await axios.get(targetUrl, {
            headers: {
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`
            }
        });
        console.log('Success! Status:', response.status);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

testProxy();
