import axios from 'axios'

const apiInstance = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
})
const stripe = Stripe('pk_test_51FrQwlBnheRwo4jaGI5iqBTAA9Z9KnwBOOCiNoTMhhLsox5vKpFPB8s61gacy9H4kQZ0Jol31w1KpAHtuS7MKO1100ZOqM7qyt');

export async function downloadAll(email) {
    return apiInstance.post('/download-all', { email })
    .then(res => alert(res.data.message))
    .catch(res => alert(res.data.message))
}

export async function getItems() {
    const res = await apiInstance.get('/items')  // The response from the API server is stored in the res variable
    return res.data // res.data property contains the data returned by the API server
}

export function downloadItem(itemId) {
    return apiInstance.post('/download-email', { itemId })
    .then(res => alert(res.data.message))
    .catch(res => alert(res.data.message))
}

export function purchaseItem(itemId) {
    return apiInstance.post('/create-checkout-session', {
        itemId,
    })
        .then((res) => {
            return stripe.redirectToCheckout({ sessionId: res.data.id });
        })
        .then(function (result) {
            if (result.error) {
                alert(result.error.message);
            }
        })
        .catch(function (error) {
            console.error("Error:", error)
            alert(error)
        });
}