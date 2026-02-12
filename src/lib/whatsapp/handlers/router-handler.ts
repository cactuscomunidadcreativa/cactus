/**
 * Router handler: shows the main menu and help messages.
 */
export function getMenuMessage(): string {
  return [
    '¡Hola! Soy Cactus 🌵',
    '',
    'Puedo ayudarte con:',
    '1️⃣ WeekFlow - Tareas y equipo',
    '2️⃣ Ramona - Marketing con IA',
    '3️⃣ Ayuda',
    '',
    'Escribe el número o tu mensaje.',
  ].join('\n');
}

export function getHelpMessage(): string {
  return [
    'Escribe:',
    '• "tarea [texto]" para crear una tarea',
    '• "post [tema]" para generar contenido',
    '• "tareas" para ver tus tareas',
    '• "menu" para ver opciones',
  ].join('\n');
}

export function getUnknownUserMessage(platformUrl: string): string {
  return `No reconozco este número. Vincula tu teléfono en la plataforma:\n${platformUrl}`;
}
