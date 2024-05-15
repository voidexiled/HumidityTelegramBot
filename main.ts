import { Telegraf } from "telegraf";
import axios from "axios";
import { Metric } from "./types";

const bot = new Telegraf("7126641311:AAHEiEza9UQXQbBVdfzRs7ltEjE31qGR68E");

const queryTo = (pathname?: string): string => {
  return `http://localhost:3000/api/metrics${pathname!}`;
};

bot.start((ctx) => {
  ctx.reply(
    "este es un bot para medir la humedad de la planta" +
      "\nsi quiere informacion de los comandos use /help"
  );
});

bot.help((ctx) => {
  const help_message = `
    ---/ Bienvenido a tu asistente de plantas. \\--- \n
    --Comandos-- \n
    > /datos - muestra todas las capturas de humedad registradas \n
    > /diario - muestra la capturas de humedad del dia \n
    > /semanal - muestra la capturas de humedad de la semana \n
    > /mensual - muestra la capturas de humedad del mes \n
    > /anual - muestra la capturas de humedad del año \n
    > /ultimo - muestra la ultima captura de humedad \n
    `;
  ctx.reply(help_message);
});

bot.command("info", async (ctx) => {
  const mensaje_info =
    "La orquídea debe tener un nivel de humedad entre 55 % y 75 %." +
    '\nLas orquídeas necesitan agua abundante, pero no toleran los encharcamientos. "Deben regarse siempre por la mañana y, a ser posible, por inmersión", aconseja Ecología Verde. Observa que el sustrato esté seco antes de regar una vez cada 7 o 10 días, aunque esta frecuencia puede variar según la estación y el clima';
  ctx.reply(mensaje_info);
});

/* new endpoints */

bot.command("datos", async (ctx) => {
  try {
    const response = await axios.get(queryTo("/"));
    const data = response.data.metrics as Metric[]; // Datos en formato JSON
    console.log(data);
    const humidities = data.map((item) => item.humidity); // Extraer la humedad de los datos
    const sum = humidities.reduce((acc, humidity) => acc + humidity, 0); // Calcular la suma de las humedades
    const promedio = sum / humidities.length; // Calcular el promedio
    const varianza =
      humidities.reduce(
        (acc, humidity) => acc + Math.pow(humidity - promedio, 2),
        0
      ) / humidities.length; // Calcular la varianza

    ctx.reply(`El promedio de humedad es: ${promedio.toFixed(2)}%`); // Responder al usuario con el promedio
    ctx.reply(`La varianza de la humedad es: ${varianza.toFixed(2)}`); // Responder al usuario con la varianza
    ctx.reply(
      `La desviación estándar de la humedad es: ${Math.sqrt(varianza).toFixed(
        2
      )}`
    ); // Responder al usuario con la desviación estándar

    if (promedio < 55.0) {
      ctx.reply("La planta necesita más humedad, favor de regarla");
    }
  } catch (error) {
    ctx.reply(
      "No se pudo calcular la media, la varianza y la desviación estándar del año"
    );
    console.error("Error al calcular los estadísticos:", error);
  }
});

bot.command("ultimo", async (ctx) => {
  try {
    const response = await axios.get(queryTo("/last"));
    const data = response.data.lastMetric as Metric; // datos en formato JSON
    console.log(data);
    ctx.reply(
      `--- Ultima metrica ---\n
      Humedad: ${data.humidity}%\n
      Fecha: ${data.year}-${data.month}-${data.day}\n
      Hora: ${data.hour} HRS\n
      `
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ctx.replyWithPhoto({
      url: `http://localhost:3000/images/${data.filenameImage}`,
    });
  } catch (error) {
    ctx.reply("No se pudo obtener la ultima metrica.");
  }
});

bot.command("anual", async (ctx) => {
  try {
    const response = await axios.get(queryTo("/year"));
    const data = response.data.metrics as Metric[]; // Datos en formato JSON
    console.log(data);
    // const humidities = data.map((item) => item.humidity); // Extraer la humedad de los datos
    // const sum = humidities.reduce((acc, humidity) => acc + humidity, 0); // Calcular la suma de las humedades
    // const promedio = sum / humidities.length; // Calcular el promedio
    // const varianza =
    //   humidities.reduce(
    //     (acc, humidity) => acc + Math.pow(humidity - promedio, 2),
    //     0
    //   ) / humidities.length; // Calcular la varianza
    // ctx.reply(`El promedio de humedad es: ${promedio.toFixed(2)}%`); // Responder al usuario con el promedio
    // ctx.reply(`La varianza de la humedad es: ${varianza.toFixed(2)}`); // Responder al usuario con la varianza
    // ctx.reply(
    //   `La desviación estándar de la humedad es: ${Math.sqrt(varianza).toFixed(
    //     2
    //   )}`
    // );

    if (data.length === 0) {
      ctx.reply("No se encontraron datos para el año");
      return;
    }
    data.map(async (metric) => {
      ctx.reply(`
      --- Metrica ${metric.id} ---\n
      Humedad: ${metric.humidity}%\n
      Fecha: ${metric.year}-${metric.month}-${metric.day}\n
      Hora: ${metric.hour} HRS\n
      `);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
  } catch (error) {
    ctx.reply("Error al obtener los datos del año");
  }
});
bot.command("mensual", async (ctx) => {
  try {
    const response = await axios.get(queryTo("/month"));
    const data = response.data.metrics as Metric[]; // datos en formato JSON
    console.log(data);
    if (data.length === 0) {
      ctx.reply("No se encontraron datos para el mes");
      return;
    }
    data.map((metric) => {
      ctx.reply(`
      --- Metrica ${metric.id} ---\n
      Humedad: ${metric.humidity}%\n
      Fecha: ${metric.year}-${metric.month}-${metric.day}\n
      Hora: ${metric.hour} HRS\n
      `);
    });
  } catch (error) {
    ctx.reply("Error al obtener los datos del mes");
  }
});
bot.command("semanal", async (ctx) => {
  try {
    const response = await axios.get(queryTo("/week"));
    const data = response.data.metrics as Metric[]; // datos en formato JSON
    console.log(data);
    if (data.length === 0) {
      ctx.reply("No se encontraron datos para la semana");
      return;
    }
    data.map((metric) => {
      ctx.reply(`
      --- Metrica ${metric.id} ---\n
      Humedad: ${metric.humidity}%\n
      Fecha: ${metric.year}-${metric.month}-${metric.day}\n
      Hora: ${metric.hour} HRS\n
      `);
    });
  } catch (error) {
    ctx.reply("Error al obtener los datos de la semana");
  }
});
bot.command("diario", async (ctx) => {
  try {
    const response = await axios.get(queryTo("/day"));

    const data = response.data.metrics as Metric[]; // datos en formato JSON
    if (data.length === 0) {
      ctx.reply("No se encontraron datos para el dia");
      return;
    }
    data.map((metric) => {
      ctx.reply(`
      --- Metrica ${metric.id} ---\n
      Humedad: ${metric.humidity}%\n
      Fecha: ${metric.year}-${metric.month}-${metric.day}\n
      Hora: ${metric.hour} HRS\n
      `);
    });
  } catch (error) {
    ctx.reply("Error al obtener los datos del dia");
  }
});

bot.launch();
