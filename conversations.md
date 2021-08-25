# Notas sobre la creacion de conversaciones en la consola

Lo primero que hice fue crear el slot type "service" con los servicios de voluntariado

## Creacion de dialogo

Empezamos creando un dialogo "RequestVolunteer1"

El primer "user says" tiene que ser InvokeAPI
En la utterance de definicion se pueden highlightear partes para definir slots.
Esto es necesario para crear las variables, A cada slot se le asigna una variable

Se crea un utterance set para esta linea, con todas las variaciones, incluida la misma linea

Luego en el turno de ConfirmAPI se usan esas variables para pasarle a la api como argumentos.
No tengo claro qué es el "Additional Responses"

El turno Affirm dispara la llamada

El turno API Sucess: hay que ponerle nombre a la variable de respuesta.
La condicion no la entiendo tampoco.

Ni la posibilidad de otro Act, porque solo deja "Offer Next API"


## Dudas
1. cómo ir para atrás con un cambio en la consola. 
Ya que cada cosa que se hace, impacta en varios paneles (api, dialog, utterances, responses).

2. cómo usar los id de slots, o valores resueltos, en los responses
Por ejemplo, si pido "ayuda con la tablet" me diga en la confirmacion "asistencia digital"

3. los Deny hay que ponerlos en los dialogos? cómo?
