    import { Telegraf }  from "telegraf";
    import axios  from "axios";
    import { rejects } from "assert";
    import fs from "fs";
    const bot = new Telegraf('7126641311:AAHEiEza9UQXQbBVdfzRs7ltEjE31qGR68E');
    const url = 'http://localhost:3000/metrics'
    const url_ultimo = 'http://localhost:3000/metrics/last'
    const semana = 'http://localhost:3000/metrics/2024/12/4?is-week=true'
    const url_image = 'http://localhost:3000/images/2024-05-06T02_13_21.450174953Z.png';
    const url_servidor = 'http://localhost:3000/'
    const url_last_image = url_servidor + 'images/last'
    const url_images = url_servidor + 'images/'


    bot.start((ctx)=>{
    ctx.reply('este es un bot para medir la humedad de la planta'+ '\nsi quiere informacion de los comandos use /help');
    })

    bot.help((ctx)=>{
        const mensaje_help = 'el comando /ultimo nos sireve para la ultima captura de humedad' + 
        '\nel comando /semana nos da la media de la semana' + 
        '\nel comando /datos nos da la informacion de los primeros datos almacenados'+
        '\nsi quieres consultal informacion basica de la orquidea use /info'+
        '\n/ultima_imagen'+
        '\n/year' + 
        '\n/dia El dormato se manda con el año, mes y dia, ejemplo:(2024/10/12)'+
        '\n/pendientes';
        ctx.reply(mensaje_help);
    })

    bot.command('info', async(ctx) =>{
        const mensaje_info = 'La orquídea debe tener un nivel de humedad entre 55 % y 75 %.'+
        '\nLas orquídeas necesitan agua abundante, pero no toleran los encharcamientos. "Deben regarse siempre por la mañana y, a ser posible, por inmersión", aconseja Ecología Verde. Observa que el sustrato esté seco antes de regar una vez cada 7 o 10 días, aunque esta frecuencia puede variar según la estación y el clima';
        ctx.reply(mensaje_info);
    })


    bot.command('ultimo',async (ctx)=>{
    await axios.get(url_ultimo)
    .then(response => {
        const H = response.data[0].humidity;
        const mensaje = 'la humedad es de: ' + JSON.stringify(H);
        ctx.reply(mensaje);
        console.log('res', H);
        if(H<5.5){
            console.log('moja mas')
            ctx.reply('la planta necesita mas humedad, favor de regarla')
        }
    })
    .catch(error => {
        ctx.reply('no se encontró')
        console.log('no pasó')
    })
    });

    bot.command('semana', async(ctx)=>{
        try{
        const response = await axios.get(semana);
        const data = response.data; // Datos en formato JSON

        // Extraer la humedad de los datos
        const humedades = data.map(item => item.humidity);

        // Calcular el promedio
        const sum = humedades.reduce((acc, humedad) => acc + humedad, 0);
        const promedio = sum / humedades.length;

        // Calcular la varianza
        const varianza = humedades.reduce((acc, humedad) => acc + Math.pow(humedad - promedio, 2), 0) / humedades.length;

        // Calcular la desviación estándar
        const desviacionEstandar = Math.sqrt(varianza);

        // Responder al usuario con los resultados
        ctx.reply(`El promedio de humedad de la última semana es: ${promedio.toFixed(2)}%` );
        ctx.reply(`La varianza de la humedad de la última semana es: ${varianza.toFixed(2)}`);
        ctx.reply(`La desviación estándar de la humedad de la última semana es: ${desviacionEstandar.toFixed(2)}`);

        // Si el promedio es menor que 55, sugerir regar la planta
       // if (promedio < 55.00) {
         //   ctx.reply('La planta necesita más humedad, favor de regarla');
        //}
    } catch (error) {
        ctx.reply('No se pudo calcular la media, la varianza y la desviación estándar de la semana');
        console.error('Error al calcular los estadísticos:', error);
    }
    })

    bot.command('datos', async (ctx) => {
        try {
            const response = await axios.get(url);
            const data = response.data;

            // Dividir los datos en páginas de tamaño fijo
            const pageSize = 10;
            const pages = [];
            for (let i = 0; i < data.length; i += pageSize) {
                pages.push(data.slice(i, i + pageSize));
            }

            // Mostrar la primera página de datos al usuario
            await enviarPagina(ctx, pages, 0);
        } catch (error) {
            ctx.reply('No se pudieron obtener los datos');
            console.error('Error al obtener los datos:', error);
        }
    });

    // Función para enviar una página de datos al usuario
    async function enviarPagina(ctx, pages, pageNumber) {
        const page = pages[pageNumber];
        if (page) {
            // Formatear los datos de la página actual
            const formattedData = page.map(item => `${item.time}: ${item.humidity}`);

            // Enviar los datos formateados como mensaje
            await ctx.reply(`Estos son los datos (página ${pageNumber + 1}): \n${formattedData.join('\n')}`);

            // Si hay más páginas, preguntar al usuario si quiere ver la siguiente página
            if (pageNumber < pages.length - 1) {
                await ctx.reply('¿Quieres ver la siguiente página?', Markup.inlineKeyboard([
                    Markup.button.callback('Siguiente página', `nextPage_${pageNumber + 1}`),
                    Markup.button.callback('Cancelar', 'cancel')
                ]));
            }
        } else {
            // Si no hay más páginas, informar al usuario
            await ctx.reply('No hay más datos disponibles');
        }
    }

    // Manejar la respuesta del usuario para mostrar la siguiente página
    bot.action(/nextPage_(\d+)/, async (ctx) => {
        const pageNumber = parseInt(ctx.match[1]);
        await enviarPagina(ctx, pages, pageNumber);
    });

    // Manejar la respuesta del usuario si decide cancelar la paginación
    bot.action('cancel', async (ctx) => {
        await ctx.reply('Paginación cancelada');
    });

    bot.command('ultima_imagen',async(ctx)=>{
        try {
        // Recuperamos la información de la ultima imagen
        await axios.get(url_last_image) .then((response) => {
            // Utilizamos el URL de la ultima imagen para formar el URL de la imagen en el servidor
                    const last_image_url = url_images + response.data[0].url
    
            // Como no podemos usar el puro URL, porque telegram necesita acceso a la imagen
            // Lo que podemos hacer es guardar la imagen localmente
            // La vamos a guardar como 'tmp.png'
            const file = fs.createWriteStream("tmp.png");
            axios.get(last_image_url, {responseType: 'stream'}).then((response) => {
                response.data.pipe(file)
            })
    
            // Una vez guardamos la imagen localmente, la enviamos al chat
            ctx.replyWithPhoto({ source: fs.readFileSync('tmp.png') });
            });
    
        } catch (error) {
            console.log('error: ', error);
            ctx.reply('No se pudo encontrar la imagen');
        }
    });
      

    bot.command('year', async(ctx) =>{
        try {
            const response = await axios.get(url);
            const data = response.data; // Datos en formato JSON
    
            // Extraer la humedad de los datos
            const humedades = data.map(item => item.humidity);
    
            // Calcular el promedio
            const sum = humedades.reduce((acc, humedad) => acc + humedad, 0);
            const promedio = sum / humedades.length;
    
            // Calcular la varianza
            const varianza = humedades.reduce((acc, humedad) => acc + Math.pow(humedad - promedio, 2), 0) / humedades.length;
    
            // Calcular la desviación estándar
            const desviacionEstandar = Math.sqrt(varianza);
    
            // Responder al usuario con los resultados
            ctx.reply(`El promedio de humedad del año es: ${promedio.toFixed(2)}%`);
            ctx.reply(`La varianza de la humedad del año es: ${varianza.toFixed(2)}`);
            ctx.reply(`La desviación estándar de la humedad del año es: ${desviacionEstandar.toFixed(2)}`);
    
            // Si el promedio es menor que 55, sugerir regar la planta
          //  if (promedio < 55.00) {
            //    ctx.reply('La planta necesita más humedad, favor de regarla');
            //}
        } catch (error) {
            ctx.reply('No se pudo calcular la media, la varianza y la desviación estándar del año');
            console.error('Error al calcular los estadísticos:', error);
        }
    })

    bot.command('dia', async(ctx) => {
        try {
            // Obtener la fecha especificada por el usuario (formato: /mostrar_humedad_dia año/mes/día)
            const userData = ctx.message.text.split(' ')[1];
            const [year, month, day] = userData.split('/');
    
            // Crear la URL para obtener los datos del día especificado
            const url = `http://localhost:3000/metrics/${year}/${month}/${day}`;
    
            // Obtener los datos del servidor
            const response = await axios.get(url);
            const jsonData = response.data;
    
            // Filtrar los datos para obtener solo los del día especificado
            const dataForDay = jsonData.filter(entry => {
                const entryDate = new Date(entry.time);
                return entryDate.getFullYear() == year &&
                    entryDate.getMonth() + 1 == month &&
                    entryDate.getDate() == day;
            });
    
            // Extraer solo los valores de humedad de los datos filtrados
            const humidities = dataForDay.map(entry => entry.humidity);
    
            // Crear una cadena formateada con los valores de humedad
            const formattedMessage = `Valores de humedad para el día ${year}-${month}-${day}: ${humidities.join(', ')}%`;
    
            // Enviar el mensaje formateado como respuesta al usuario
            console.log(formattedMessage,JSON.stringify(humidities))
            ctx.reply(formattedMessage);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            ctx.reply('Ocurrió un error al obtener los datos del servidor');
        }
    })

    bot.command('pendientes',async(ctx) => {
        try {
            const pendingUrl = 'http://localhost:3000/images/pending';
    
            // Realizar la solicitud HTTP para obtener los datos de las imágenes pendientes
            const response = await axios.get(pendingUrl);
            const imageDataArray = response.data;
    
            console.log('Datos de imágenes pendientes:', JSON.stringify(imageDataArray));
    
            // Verificar si se encontraron datos de imágenes pendientes
            if (imageDataArray && imageDataArray.length > 0) {
                console.log('Iterando sobre los datos de imágenes pendientes...');
                // Iterar sobre cada objeto JSO N y enviarlo como mensaje
                imageDataArray.forEach((imageData, index) => {
                    const message = `Imagen ${index + 1}:\n${JSON.stringify(imageData, null, 2)}`;
                    ctx.reply(message);
                });
            } else {
                console.log('No se encontraron imágenes pendientes');
                ctx.reply('No se encontraron imágenes pendientes');
            }
        } catch (error) {
            console.error('Error al obtener las imágenes pendientes:', error);
            ctx.reply('No se pudieron obtener las imágenes pendientes');
        }
    })

    
   
    bot.launch();
