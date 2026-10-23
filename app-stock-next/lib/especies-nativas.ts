// Listado de árboles y arbustos NATIVOS de Argentina que suelen producirse en viveros.
//
// No es un listado oficial: SENASA no publica uno de especies nativas. Su único listado para viveros
// (Resolución SENASA 64/2026, "especies priorizadas") es de frutales, cítricos, palmeras, eucaliptus, etc.
// Este listado lo armó Claude a partir de nombres de uso común y conviene que alguien del vivero lo revise.
//
// Para agregar o corregir especies: editá este archivo y corré `npm.cmd run cargar-especies`
// (agrega las que falten en la base; las que ya existen no se tocan, salvo la región si estaba vacía).
//
// El código tiene que ser único y no se cambia una vez que la especie tiene movimientos.
// "minimo" es el stock mínimo para el aviso (0 = sin aviso). Por ahora ninguna tiene: se cargan desde
// el panel de Neon cuando el vivero los defina.
import type { Especie } from './tipos';

function especie(codigo: string, comun: string, cientifico: string, region: string, minimo = 0): Especie {
  return { codigo, comun, cientifico, region, minimo };
}

export const ESPECIES_NATIVAS: Especie[] = [
  // Las primeras 23: las que estaban desde el principio.
  especie('ALG', 'Algarrobo blanco', 'Prosopis alba', 'Chaco, Espinal'),
  especie('ALN', 'Algarrobo negro', 'Prosopis nigra', 'Chaco, Espinal'),
  especie('ANC', 'Anchico colorado', 'Parapiptadenia rigida', 'Selva paranaense'),
  especie('ARR', 'Arrayán', 'Blepharocalyx salicifolius', 'Selva paranaense, Yungas, Delta y ribera'),
  especie('CEI', 'Ceibo', 'Erythrina crista-galli', 'Delta y ribera'),
  especie('CHL', 'Chal-chal', 'Allophylus edulis', 'Selva paranaense, Yungas, Delta y ribera'),
  especie('CHN', 'Chañar', 'Geoffroea decorticans', 'Chaco, Monte, Espinal'),
  especie('COR', 'Coronillo', 'Scutia buxifolia', 'Espinal, Pampa'),
  especie('CUR', 'Curupí', 'Sapium haematospermum', 'Delta y ribera'),
  especie('ESP', 'Espinillo', 'Vachellia caven', 'Espinal, Chaco'),
  especie('ING', 'Ingá', 'Inga uruguensis', 'Delta y ribera, Selva paranaense'),
  especie('JAC', 'Jacarandá', 'Jacaranda mimosifolia', 'Yungas'),
  especie('LAP', 'Lapacho rosado', 'Handroanthus impetiginosus', 'Yungas, Chaco'),
  especie('MOL', 'Molle', 'Schinus longifolius', 'Espinal, Pampa'),
  especie('PAL', 'Palo borracho', 'Ceiba speciosa', 'Selva paranaense, Chaco'),
  especie('PIT', 'Pitanga', 'Eugenia uniflora', 'Selva paranaense, Delta y ribera'),
  especie('QBL', 'Quebracho blanco', 'Aspidosperma quebracho-blanco', 'Chaco, Monte'),
  especie('QCO', 'Quebracho colorado chaqueño', 'Schinopsis balansae', 'Chaco'),
  especie('SAU', 'Sauce criollo', 'Salix humboldtiana', 'Delta y ribera'),
  especie('SDT', 'Sombra de toro', 'Jodina rhombifolia', 'Espinal, Chaco'),
  especie('TAL', 'Tala', 'Celtis tala', 'Espinal, Pampa, Chaco'),
  especie('TIM', 'Timbó', 'Enterolobium contortisiliquum', 'Chaco, Selva paranaense, Yungas'),
  especie('TIP', 'Tipa', 'Tipuana tipu', 'Yungas'),

  // Yungas
  especie('ALI', 'Aliso del cerro', 'Alnus acuminata', 'Yungas'),
  especie('CDO', 'Cedro orán', 'Cedrela balansae', 'Yungas'),
  especie('CDC', 'Cedro coya', 'Cedrela angustifolia', 'Yungas'),
  especie('CEB', 'Cebil colorado', 'Anadenanthera colubrina', 'Yungas, Chaco'),
  especie('CNV', 'Carnaval', 'Senna spectabilis', 'Yungas'),
  especie('CSA', 'Ceibo salteño', 'Erythrina falcata', 'Yungas'),
  especie('HCE', 'Horco cebil', 'Parapiptadenia excelsa', 'Yungas'),
  especie('LAF', 'Laurel de la falda', 'Cinnamomum porphyrium', 'Yungas'),
  especie('MAT', 'Mato', 'Myrcianthes pseudomato', 'Yungas'),
  especie('NOG', 'Nogal criollo', 'Juglans australis', 'Yungas'),
  especie('PAA', 'Palo amarillo', 'Phyllostylon rhamnoides', 'Yungas, Chaco'),
  especie('PBL', 'Palo blanco', 'Calycophyllum multiflorum', 'Yungas, Chaco'),
  especie('PCE', 'Pino del cerro', 'Podocarpus parlatorei', 'Yungas'),
  especie('QUI', 'Quina', 'Myroxylon peruiferum', 'Yungas'),
  especie('TCO', 'Tipa colorada', 'Pterogyne nitens', 'Yungas, Chaco'),
  especie('URU', 'Urundel', 'Astronium urundeuva', 'Yungas, Chaco'),
  especie('VIS', 'Viscote', 'Acacia visco', 'Yungas, Sierras'),

  // Selva paranaense (Misiones y alrededores)
  especie('AGI', 'Aguaí', 'Chrysophyllum gonocarpum', 'Selva paranaense'),
  especie('AMB', 'Ambay', 'Cecropia pachystachya', 'Selva paranaense'),
  especie('CAN', 'Cancharana', 'Cabralea canjerana', 'Selva paranaense'),
  especie('CER', 'Cerella', 'Eugenia involucrata', 'Selva paranaense'),
  especie('CMI', 'Cedro misionero', 'Cedrela fissilis', 'Selva paranaense'),
  especie('GBL', 'Guatambú blanco', 'Balfourodendron riedelianum', 'Selva paranaense'),
  especie('GRA', 'Grapia', 'Apuleia leiocarpa', 'Selva paranaense'),
  especie('GUB', 'Guabiyú', 'Myrcianthes pungens', 'Selva paranaense, Yungas'),
  especie('GUY', 'Guayaibí', 'Cordia americana', 'Selva paranaense, Chaco'),
  especie('IBP', 'Ibirá pitá (caña fístola)', 'Peltophorum dubium', 'Selva paranaense, Chaco'),
  especie('INC', 'Incienso', 'Myrocarpus frondosus', 'Selva paranaense'),
  especie('LAM', 'Lapacho amarillo', 'Handroanthus albus', 'Selva paranaense'),
  especie('LBL', 'Loro blanco', 'Bastardiopsis densiflora', 'Selva paranaense'),
  especie('LNE', 'Lapacho negro', 'Handroanthus heptaphyllus', 'Selva paranaense, Chaco'),
  especie('MPR', 'María preta', 'Diatenopteryx sorbifolia', 'Selva paranaense'),
  especie('PDB', 'Pata de buey', 'Bauhinia forficata', 'Selva paranaense, Delta y ribera'),
  especie('PET', 'Peteribí', 'Cordia trichotoma', 'Selva paranaense'),
  especie('PIN', 'Pindó', 'Syagrus romanzoffiana', 'Selva paranaense, Delta y ribera'),
  especie('PPA', 'Pino Paraná', 'Araucaria angustifolia', 'Selva paranaense'),
  especie('PRO', 'Palo rosa', 'Aspidosperma polyneuron', 'Selva paranaense'),
  especie('SDR', 'Sangre de drago', 'Croton urucurana', 'Selva paranaense, Delta y ribera'),
  especie('TEM', 'Tembetarí', 'Zanthoxylum rhoifolium', 'Selva paranaense'),
  especie('UBA', 'Ubajay', 'Hexachlamys edulis', 'Selva paranaense, Delta y ribera'),
  especie('YER', 'Yerba mate', 'Ilex paraguariensis', 'Selva paranaense'),
  especie('YVA', 'Yvapurú', 'Plinia peruviana', 'Selva paranaense'),

  // Chaco
  especie('BRE', 'Brea', 'Parkinsonia praecox', 'Chaco, Monte'),
  especie('CAR', 'Caranday', 'Copernicia alba', 'Chaco'),
  especie('CIN', 'Cina-cina', 'Parkinsonia aculeata', 'Chaco, Monte, Espinal'),
  especie('GAR', 'Garabato', 'Senegalia praecox', 'Chaco'),
  especie('GUA', 'Guayacán', 'Libidibia paraguariensis', 'Chaco'),
  especie('GUR', 'Guaraniná', 'Sideroxylon obtusifolium', 'Chaco, Espinal'),
  especie('ITI', 'Itín', 'Prosopis kuntzei', 'Chaco'),
  especie('LAB', 'Lapacho blanco', 'Tabebuia roseoalba', 'Chaco, Yungas'),
  especie('MIS', 'Mistol', 'Sarcomphalus mistol', 'Chaco'),
  especie('PCR', 'Palo cruz', 'Tabebuia nodosa', 'Chaco'),
  especie('PSA', 'Palo santo', 'Bulnesia sarmientoi', 'Chaco'),
  especie('QCS', 'Quebracho colorado santiagueño', 'Schinopsis lorentzii', 'Chaco'),
  especie('TUS', 'Tusca', 'Vachellia aroma', 'Chaco, Espinal'),
  especie('VIN', 'Vinal', 'Prosopis ruscifolia', 'Chaco'),

  // Espinal, Pampa y Sierras
  especie('AGU', 'Aguaribay', 'Schinus areira', 'Sierras, Monte, Chaco'),
  especie('CAL', 'Caldén', 'Prosopis caldenia', 'Espinal'),
  especie('COC', 'Coco', 'Zanthoxylum coco', 'Sierras, Chaco'),
  especie('COE', 'Coentrillo', 'Zanthoxylum fagara', 'Espinal, Chaco, Delta y ribera'),
  especie('MBE', 'Molle de beber', 'Lithraea molleoides', 'Sierras, Espinal'),
  especie('MCA', 'Manzano del campo', 'Ruprechtia apetala', 'Sierras, Chaco'),
  especie('MRD', 'Moradillo', 'Schinus fasciculatus', 'Espinal, Sierras'),
  especie('NAN', 'Ñandubay', 'Prosopis affinis', 'Espinal'),
  especie('OQU', 'Orco quebracho', 'Schinopsis marginata', 'Sierras'),
  especie('PIQ', 'Piquillín', 'Condalia microphylla', 'Monte, Espinal'),
  especie('SEN', 'Sen del campo', 'Senna corymbosa', 'Pampa, Espinal, Delta y ribera'),
  especie('TAB', 'Tabaquillo', 'Polylepis australis', 'Sierras'),
  especie('TIN', 'Tintitaco', 'Prosopis torquata', 'Chaco, Monte'),

  // Delta y ribera (Paraná, Uruguay y Río de la Plata)
  especie('AZC', 'Azota caballo', 'Luehea divaricata', 'Delta y ribera, Selva paranaense'),
  especie('BLA', 'Blanquillo', 'Sebastiania commersoniana', 'Delta y ribera'),
  especie('CNL', 'Canelón', 'Myrsine laetevirens', 'Delta y ribera'),
  especie('FBR', 'Fumo bravo', 'Solanum granulosoleprosum', 'Delta y ribera, Selva paranaense'),
  especie('HIG', 'Higuerón', 'Ficus luschnathiana', 'Delta y ribera, Selva paranaense'),
  especie('LCR', 'Laurel criollo', 'Ocotea acutifolia', 'Delta y ribera'),
  especie('MTJ', 'Mataojo', 'Pouteria salicifolia', 'Delta y ribera'),
  especie('OMB', 'Ombú', 'Phytolacca dioica', 'Pampa, Delta y ribera'),
  especie('RMO', 'Rabo molle', 'Lonchocarpus nitidus', 'Delta y ribera, Espinal'),
  especie('SAC', 'Sauco', 'Sambucus australis', 'Delta y ribera, Pampa'),
  especie('SBL', 'Sarandí blanco', 'Phyllanthus sellowianus', 'Delta y ribera'),
  especie('SCO', 'Sarandí colorado', 'Cephalanthus glabratus', 'Delta y ribera'),
  especie('TRM', 'Tarumá', 'Citharexylum montevidense', 'Delta y ribera'),
  especie('YAT', 'Palmera yatay', 'Butia yatay', 'Espinal, Delta y ribera'),

  // Monte (Cuyo y Patagonia norte)
  especie('ALC', 'Algarrobo chileno', 'Prosopis chilensis', 'Monte'),
  especie('ALD', 'Algarrobo dulce', 'Prosopis flexuosa', 'Monte'),
  especie('ALP', 'Alpataco', 'Prosopis alpataco', 'Monte'),
  especie('JAR', 'Jarilla', 'Larrea divaricata', 'Monte'),
  especie('MNE', 'Monte negro', 'Bougainvillea spinosa', 'Monte'),
  especie('RET', 'Retamo', 'Bulnesia retama', 'Monte'),
  especie('ZAM', 'Zampa', 'Atriplex lampa', 'Monte'),

  // Bosque andino patagónico
  especie('ALE', 'Alerce', 'Fitzroya cupressoides', 'Patagonia andina'),
  especie('ARP', 'Arrayán patagónico', 'Luma apiculata', 'Patagonia andina'),
  especie('AVE', 'Avellano', 'Gevuina avellana', 'Patagonia andina'),
  especie('CGU', 'Ciprés de las Guaitecas', 'Pilgerodendron uviferum', 'Patagonia andina'),
  especie('CIP', 'Ciprés de la cordillera', 'Austrocedrus chilensis', 'Patagonia andina'),
  especie('CLF', 'Calafate', 'Berberis microphylla', 'Patagonia andina'),
  especie('CNE', 'Canelo', 'Drimys winteri', 'Patagonia andina'),
  especie('COI', 'Coihue', 'Nothofagus dombeyi', 'Patagonia andina'),
  especie('GUI', 'Guindo', 'Nothofagus betuloides', 'Patagonia andina'),
  especie('LAU', 'Laura', 'Schinus patagonicus', 'Patagonia andina'),
  especie('LEN', 'Lenga', 'Nothofagus pumilio', 'Patagonia andina'),
  especie('MAI', 'Maitén', 'Maytenus boaria', 'Patagonia andina'),
  especie('MAN', 'Mañío macho', 'Podocarpus nubigenus', 'Patagonia andina'),
  especie('MAQ', 'Maqui', 'Aristotelia chilensis', 'Patagonia andina'),
  especie('NIR', 'Ñire', 'Nothofagus antarctica', 'Patagonia andina'),
  especie('NOT', 'Notro', 'Embothrium coccineum', 'Patagonia andina'),
  especie('PEH', 'Pehuén', 'Araucaria araucana', 'Patagonia andina'),
  especie('RAD', 'Radal', 'Lomatia hirsuta', 'Patagonia andina'),
  especie('RAU', 'Raulí', 'Nothofagus alpina', 'Patagonia andina'),
  especie('RPE', 'Roble pellín', 'Nothofagus obliqua', 'Patagonia andina'),
];
