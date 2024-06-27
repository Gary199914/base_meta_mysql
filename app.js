require('dotenv').config();
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const MetaProvider = require('@bot-whatsapp/provider/meta')
const MySQLAdapter = require('@bot-whatsapp/database/mysql')
const express = require('express')
const bodyParser = require('body-parser')

/**
 * Declaramos las conexiones de MySQL
 */
const MYSQL_DB_HOST = 'localhost'
const MYSQL_DB_USER = 'root'
const MYSQL_DB_PASSWORD = 'megatravel123'
const MYSQL_DB_NAME = 'chat'
const MYSQL_DB_PORT = '3306'

/**
 * Aqui declaramos los flujos hijos, los flujos se declaran de atras para adelante, es decir que si tienes un flujo de este tipo:
 *
 *          Menu Principal
 *           - SubMenu 1
 *             - Submenu 1.1
 *           - Submenu 2
 *             - Submenu 2.1
 *
 * Primero declaras los submenus 1.1 y 2.1, luego el 1 y 2 y al final el principal.
 */

const flowSecundario = addKeyword(['2', 'siguiente']).addAnswer(['📄 Aquí tenemos el flujo secundario'])

const flowDocs = addKeyword(['doc', 'documentacion', 'documentación']).addAnswer(
    [
        '📄 Aquí encontras las documentación recuerda que puedes mejorarla',
        'https://bot-whatsapp.netlify.app/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowTuto = addKeyword(['tutorial', 'tuto']).addAnswer(
    [
        '🙌 Aquí encontras un ejemplo rapido',
        'https://bot-whatsapp.netlify.app/docs/example/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowGracias = addKeyword(['gracias', 'grac']).addAnswer(
    [
        '🚀 Puedes aportar tu granito de arena a este proyecto',
        '[*opencollective*] https://opencollective.com/bot-whatsapp',
        '[*buymeacoffee*] https://www.buymeacoffee.com/leifermendez',
        '[*patreon*] https://www.patreon.com/leifermendez',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowDiscord = addKeyword(['discord']).addAnswer(
    ['🤪 Únete al discord', 'https://link.codigoencasa.com/DISCORD', '\n*2* Para siguiente paso.'],
    null,
    null,
    [flowSecundario]
)

const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
    .addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer(
        [
            'te comparto los siguientes links de interes sobre el proyecto',
            '👉 *doc* para ver la documentación',
            '👉 *gracias*  para ver la lista de videos',
            '👉 *discord* unirte al discord',
        ],
        null,
        null,
        [flowDocs, flowGracias, flowTuto, flowDiscord]
    )

const main = async () => {
    const adapterDB = new MySQLAdapter({
        host: MYSQL_DB_HOST,
        user: MYSQL_DB_USER,
        database: MYSQL_DB_NAME,
        password: MYSQL_DB_PASSWORD,
        port: MYSQL_DB_PORT,
    })
    const adapterFlow = createFlow([flowPrincipal])

    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: 'jwtToken',
        numberId: '59171415130',
        verifyToken: 'megtravel',
        version: 'v16.0',
    })

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    // Configurar Express
    const app = express()
    app.use(bodyParser.json())

    app.get('/webhook', (req, res) => {
        const mode = req.query['hub.mode']
        const token = req.query['hub.verify_token']
        const challenge = req.query['hub.challenge']

        if (mode && token) {
            if (mode === 'subscribe' && token === 'verifyToken') {
                console.log('WEBHOOK_VERIFIED')
                res.status(200).send(challenge)
            } else {
                res.sendStatus(403)
            }
        }
    })

    app.post('/webhook', (req, res) => {
        const body = req.body

        if (body.object === 'whatsapp_business_account') {
            body.entry.forEach(entry => {
                const webhookEvent = entry.changes[0].value
                console.log(webhookEvent)
            })
            res.status(200).send('EVENT_RECEIVED')
        } else {
            res.sendStatus(404)
        }
    })

    const PORT = process.env.PORT || 
    app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))
}

main()
