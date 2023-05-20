// Importing Modules & Frameworks.
import fetch from 'node-fetch'
import pipedrive from 'pipedrive'

// Pipedrive Config & API Key
const defaultClient = new pipedrive.ApiClient();
defaultClient.authentications.api_key.apiKey = '0e1ffab718987ff7c24d23a936909a1d81204454'

// Shopify API key & API token
let sapiKey = "56643782458b753f6abeef7de5280e77" // Shopify API Key
let apiToken = "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" // Shopify Api Token
let customerDetails; // Customer details - {email, firstName, lastName, phone}
let lineItems; // Line Items - {name, sku, price}

shopifyOrderId('5332940652848') // Calling the function with orderId.

// Taking the orderId as input and performing the actions accordingly.
function shopifyOrderId(orderId) {
    // Fetching the data from the orderId.
    fetch(`https://bf7bfd-2.myshopify.com/admin/api/2023-04/orders/${orderId}.json` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(sapiKey + ":" + apiToken).toString('base64')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const { email, first_name, last_name, phone } = data.order.customer
        customerDetails = { 
            email,
            first_name,
            last_name,
            phone
        }
        checkPerson(customerDetails) // Checking if the person already exists or not, if not, then creating a new person.

        const { name, sku, price } = data.order.line_items[0]
        lineItems = {
            name,
            sku,
            price
        }
        checkSku(lineItems) // Checking if the product already exists or not, if not, then creating a new product.

        checkPersonId() // Checking the Persons ID in order to create a new deal.
        getProductDetails() // Getting the product details in order to add product to a deal.
    })
    .catch(err => {
        console.log('Invalid Order ID')
    })
}

// Checking if the person already exists or not, if not, then creating a new person.
function checkPerson({email, first_name, last_name, phone}) {
    let name = first_name + " " + last_name
    fetch(`https://amaan.pipedrive.com/v1/persons/search?api_token=0e1ffab718987ff7c24d23a936909a1d81204454&term=${email}&exact_match=true`)
    .then(res => res.json())
    .then(data => {
        if (data.data.items.length === 0 && email != null)
            addNewPerson(name, email, phone)
        else if (email === null)
            console.log('Email Field is missing')
        else
            console.log('Person Already Exists.')
    })
    .catch( err => {
        console.error('Email Field is missing.')
    })
}

// Adding a new person on PipeDrive with this function.
async function addNewPerson(name, email, phone) {
    try {
        const api = new pipedrive.PersonsApi(defaultClient);
        const response = await api.addPerson({
            name: name,
            email: email,
            phone: phone
        });
        // console.log(response);
    } catch (err) {
        const errorToLog = err.context?.body || err;
        console.log('Adding failed', errorToLog);
    }
}

// Checking if the product already exists or not, if not, then creating a new product.
function checkSku({name, sku, price}) {
    fetch(`https://amaan.pipedrive.com/v1/products/search?api_token=0e1ffab718987ff7c24d23a936909a1d81204454&term=${sku}&exact_match=true`)
    .then(res => res.json())
    .then(data => {
        if (data.data.items.length === 0 && sku != null)
            addNewProduct(name, sku, price)
        else if (sku === null)
            console.log('SKU Field is missing')
        else
            console.log('Product Already Exists.')
    })
    .catch( err => {
        console.error('SKU Field is missing.')
    })
}

// Adding a new product on PipeDrive with this function.
async function addNewProduct(name, sku, price) {
    try {
        const api = new pipedrive.ProductsApi(defaultClient);
        const response = await api.addProduct({
            name: name,
            code: sku,
            prices: [{price: price, currency: "INR"}]
        });
        // console.log(response);
    } catch (err) {
        const errorToLog = err.context?.body || err;
        console.log('Adding failed', errorToLog);
    }
}

// Checking the Persons ID in order to create a new deal.
function checkPersonId() {
    fetch(`https://amaan.pipedrive.com/v1/persons/?api_token=0e1ffab718987ff7c24d23a936909a1d81204454`)
    .then(res => res.json())
    .then(dataP => {
        fetch('https://amaan.pipedrive.com/v1/deals/?api_token=0e1ffab718987ff7c24d23a936909a1d81204454')
        .then(res => res.json())
        .then(dataD => {
            if(!dataD.data[0].id) { // Checking if the deal already exists so we should not create a duplicate deal.
                addDeal("T-Shirt Deal", dataP.data[0].id)
            }   
            else {
                console.log('Deal Already Exists')
            }
        })
    })
}

// Adding a new deal on PipeDrive with this function.
async function addDeal(title, personId) {
    try {
        const api = new pipedrive.DealsApi(defaultClient);
        const response = await api.addDeal({
            title: title,
            person_id: personId,
        });
        // console.log(response);
    } catch (err) {
        const errorToLog = err.context?.body || err;
        console.log('Adding failed', errorToLog);
    }
}

// Getting the product details in order to add product to a deal.
function getProductDetails() {
    fetch(`https://amaan.pipedrive.com/v1/deals/?api_token=0e1ffab718987ff7c24d23a936909a1d81204454`)
    .then(res => res.json())
    .then(data => {
        let dealId = data.data[0].id
        fetch(`https://amaan.pipedrive.com/v1/products/?api_token=0e1ffab718987ff7c24d23a936909a1d81204454`)
        .then(res => res.json())
        .then(data => {
            let productId = data.data[0].id
            let price = data.data[0].prices[0].price
            let qty = 1
            addDealProduct(dealId, productId, price, qty)
        })
    })
}

// Adding a product to a deal with the required fields to PipeDrive.
async function addDealProduct(dealId, productId, price, qty) {
    try {
        const api = new pipedrive.DealsApi(defaultClient);
        let apiInstance = new pipedrive.DealsApi(defaultClient);
        let id = dealId; // Number | The ID of the deal
        let opts = pipedrive.NewDealProduct.constructFromObject({
            product_id : productId,
            item_price: price,
            quantity: qty
        });
        apiInstance.addDealProduct(id, opts).then((data) => {
            console.log('Product added to the Deal Successfully.');
        }, (error) => {
            console.error(error);
        });
    } catch (err) {
        const errorToLog = err.context?.body || err;
        console.log('Adding failed.', errorToLog);
    }
}