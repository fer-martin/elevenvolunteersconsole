# Skill con Alexa Conversations, hosteada en nuestro lambda

No se puede hacer deploy desde el cli.
No se pueden hacer cambios a la skill desde el CLI (modelos, manifest, apl, audio, conversations, etc).
SOLO DESDE CONSOLA!

1. Para bajarse el skill package:

./downloadskill.sh

2. Cuando se modifica el lambda (desde aca), para subirlo hay que correr:

./updatelambda.sh

