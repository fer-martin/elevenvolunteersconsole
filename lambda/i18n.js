/* i18n */
const moment = require('moment-timezone');

const speech = {
	'es-ES': {
		'confirm-once': (service, date, starttime, endtime) => [`Voy a solicitar un voluntario para ${service} el ${moment(date).locale('es').format('dddd D[ de ]MMMM')}, desde las ${moment('2000-01-01T' + starttime).locale('es').format('h A')} hasta las ${moment('2000-01-01T' + endtime).locale('es').format('h A')}.`],
		'confirm-rec': (service, recurring, since, until) => [`Voy a solicitar un voluntario para ${service} ${recurring}, comenzando el ${moment(since).locale('es').format('dddd, D[ de ]MMMM')}, hasta el ${moment(until).locale('es').format('dddd, D[ de ]MMMM')}.`],
		'rec-item': (dow, starttime, endtime) => [`los ${dow} de las ${moment('2000-01-01T' + starttime).locale('es').format('h A')} hasta las ${moment('2000-01-01T' + endtime).locale('es').format('h A')}`],
		'blind-families-only': () => ["este servicio es solamente para familias ciegas."],
		'service-overlaps': () => [`el servicio se superpone con otro`],
		'fallback': () => [`No estoy segura. Te puedo ayudar a solicitar un voluntario. ¿que quieres hacer?`],
		'error': () => [`Lo siento, he tenido un problema. Prueba nuevamente.`],
		'welcome': () => [`Te damos la bienvenida.`],
	}
}

exports.response = (locale, key, ...values) => {
	try {
		let phrase = speech[locale][key](...values);
		let choice = Math.floor(Math.random() * phrase.length);
		return phrase[choice] + " "; //agrega un espacio al final para separar oraciones
	}
	catch (error) {
		console.error(`Error with term (${key})`);
		return `No se encontró la frase (${key})`;
	}
}


// Código basado en https://gist.github.com/alfchee/e563340276f89b22042a
// Convierte numeros a letras (enteros, en castellano)
exports.numeroALetras = function (num) {

	function Unidades(num) {

		switch (num) {
			case 1: return 'uno';
			case 2: return 'dos';
			case 3: return 'tres';
			case 4: return 'cuatro';
			case 5: return 'cinco';
			case 6: return 'seis';
			case 7: return 'siete';
			case 8: return 'ocho';
			case 9: return 'nueve';
		}

		return '';
	}//Unidades()

	function Decenas(num) {

		let decena = Math.floor(num / 10);
		let unidad = num - (decena * 10);

		switch (decena) {
			case 1:
				switch (unidad) {
					case 0: return 'DIEZ';
					case 1: return 'ONCE';
					case 2: return 'DOCE';
					case 3: return 'TRECE';
					case 4: return 'CATORCE';
					case 5: return 'QUINCE';
					default: return 'DIECI' + Unidades(unidad);
				}
			case 2:
				switch (unidad) {
					case 0: return 'VEINTE';
					default: return 'VEINTI' + Unidades(unidad);
				}
			case 3: return DecenasY('TREINTA', unidad);
			case 4: return DecenasY('CUARENTA', unidad);
			case 5: return DecenasY('CINCUENTA', unidad);
			case 6: return DecenasY('SESENTA', unidad);
			case 7: return DecenasY('SETENTA', unidad);
			case 8: return DecenasY('OCHENTA', unidad);
			case 9: return DecenasY('NOVENTA', unidad);
			case 0: return Unidades(unidad);
		}
	}//Decenas()

	function DecenasY(strSin, numUnidades) {
		if (numUnidades > 0)
			return strSin + ' Y ' + Unidades(numUnidades)

		return strSin;
	}//DecenasY()

	function Centenas(num) {
		let centenas = Math.floor(num / 100);
		let decenas = num - (centenas * 100);

		switch (centenas) {
			case 1:
				if (decenas > 0)
					return 'CIENTO ' + Decenas(decenas);
				return 'CIEN';
			case 2: return 'DOSCIENTOS ' + Decenas(decenas);
			case 3: return 'TRESCIENTOS ' + Decenas(decenas);
			case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
			case 5: return 'QUINIENTOS ' + Decenas(decenas);
			case 6: return 'SEISCIENTOS ' + Decenas(decenas);
			case 7: return 'SETECIENTOS ' + Decenas(decenas);
			case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
			case 9: return 'NOVECIENTOS ' + Decenas(decenas);
		}

		return Decenas(decenas);
	}//Centenas()

	function Seccion(num, divisor, strSingular, strPlural) {
		let cientos = Math.floor(num / divisor)
		let resto = num - (cientos * divisor)

		let letras = '';

		if (cientos > 0)
			if (cientos > 1)
				letras = Centenas(cientos) + ' ' + strPlural;
			else
				letras = strSingular;

		if (resto > 0)
			letras += '';

		return letras;
	}//Seccion()

	function Miles(num) {
		let divisor = 1000;
		let cientos = Math.floor(num / divisor)
		let resto = num - (cientos * divisor)

		let strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
		let strCentenas = Centenas(resto);

		if (strMiles == '')
			return strCentenas;

		return strMiles + ' ' + strCentenas;
	}//Miles()

	function Millones(num) {
		let divisor = 1000000;
		let cientos = Math.floor(num / divisor)
		let resto = num - (cientos * divisor)

		let strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
		let strMiles = Miles(resto);

		if (strMillones == '')
			return strMiles;

		return strMillones + ' ' + strMiles;
	}//Millones()

	if (num == 0) return 'cero';
	return Millones(num).toLowerCase();

};

exports.numeroAOrdinal = function (num) {

	switch (num) {
		case 1: return 'primer';
		case 2: return 'segundo';
		case 3: return 'tercer';
		case 4: return 'cuarto';
		case 5: return 'quinto';
		case 6: return 'sexto';
		case 7: return 'séptimo';
		case 8: return 'octavo';
		case 9: return 'noveno';
		case 10: return 'décimo';
		default: return '';
	}
};