// Listado de especies del vivero: árboles y arbustos NATIVOS de Argentina, algunos árboles EXÓTICOS (sauce llorón,
// fresnos), PALMERAS (nativas y exóticas)
// y FRUTALES (olivo, cítricos, carozo, pepita y otros).
//
// No es un listado oficial: SENASA no publica uno de especies nativas. Su listado de "especies priorizadas"
// (Resolución SENASA 64/2026) incluye a TODAS las palmeras (familia Arecaceae) y a la cica (Cycas revoluta):
// se pueden comerciar, pero el vivero tiene que estar inscripto en el RENFO y cumplir los requisitos
// sanitarios de esa resolución. Por eso las palmeras van marcadas aparte (grupo "Palmera").
// No se incluye el palmito (Euterpe edulis): es una especie protegida.
// Este listado lo armó Claude y conviene que alguien del vivero lo revise.
//
// Para agregar o corregir especies: editá este archivo y corré `npm.cmd run cargar-especies`
// (agrega las que falten en la base; las que ya existen no se tocan, salvo la región y el grupo si estaban vacíos).
//
// El código tiene que ser único y no se cambia una vez que la especie tiene movimientos.
// "minimo" es el stock mínimo para el aviso (0 = sin aviso). Por ahora ninguna tiene: se cargan desde
// el panel de Neon cuando el vivero los defina.
import type { Especie } from './tipos';

function arbol(codigo: string, comun: string, cientifico: string, region: string, minimo = 0): Especie {
  return { codigo, comun, cientifico, region, grupo: 'Árbol', minimo };
}

// Las palmeras exóticas llevan región "Exótica".
function palmera(codigo: string, comun: string, cientifico: string, region: string, minimo = 0): Especie {
  return { codigo, comun, cientifico, region, grupo: 'Palmera', minimo };
}

// Los frutales son todos exóticos. Varios están en el listado de especies priorizadas de SENASA
// (Res. 64/2026: cítricos, carozo, pepita, palta, banano, vid, olivo, kiwi), con los mismos requisitos
// sanitarios que las palmeras.
function frutal(codigo: string, comun: string, cientifico: string, minimo = 0): Especie {
  return { codigo, comun, cientifico, region: 'Exótica', grupo: 'Frutal', minimo };
}

export const ESPECIES: Especie[] = [
  // Las primeras 23: las que estaban desde el principio.
  arbol('ALG', 'Algarrobo blanco', 'Prosopis alba', 'Chaco, Espinal'),
  arbol('ALN', 'Algarrobo negro', 'Prosopis nigra', 'Chaco, Espinal'),
  arbol('ANC', 'Anchico colorado', 'Parapiptadenia rigida', 'Selva paranaense'),
  arbol('ARR', 'Arrayán', 'Blepharocalyx salicifolius', 'Selva paranaense, Yungas, Delta y ribera'),
  arbol('CEI', 'Ceibo', 'Erythrina crista-galli', 'Delta y ribera'),
  arbol('CHL', 'Chal-chal', 'Allophylus edulis', 'Selva paranaense, Yungas, Delta y ribera'),
  arbol('CHN', 'Chañar', 'Geoffroea decorticans', 'Chaco, Monte, Espinal'),
  arbol('COR', 'Coronillo', 'Scutia buxifolia', 'Espinal, Pampa'),
  arbol('CUR', 'Curupí', 'Sapium haematospermum', 'Delta y ribera'),
  arbol('ESP', 'Espinillo', 'Vachellia caven', 'Espinal, Chaco'),
  arbol('ING', 'Ingá', 'Inga uruguensis', 'Delta y ribera, Selva paranaense'),
  arbol('JAC', 'Jacarandá', 'Jacaranda mimosifolia', 'Yungas'),
  arbol('LAP', 'Lapacho rosado', 'Handroanthus impetiginosus', 'Yungas, Chaco'),
  arbol('MOL', 'Molle', 'Schinus longifolius', 'Espinal, Pampa'),
  arbol('PAL', 'Palo borracho', 'Ceiba speciosa', 'Selva paranaense, Chaco'),
  arbol('PIT', 'Pitanga', 'Eugenia uniflora', 'Selva paranaense, Delta y ribera'),
  arbol('QBL', 'Quebracho blanco', 'Aspidosperma quebracho-blanco', 'Chaco, Monte'),
  arbol('QCO', 'Quebracho colorado chaqueño', 'Schinopsis balansae', 'Chaco'),
  arbol('SAU', 'Sauce criollo', 'Salix humboldtiana', 'Delta y ribera'),
  arbol('SDT', 'Sombra de toro', 'Jodina rhombifolia', 'Espinal, Chaco'),
  arbol('TAL', 'Tala', 'Celtis tala', 'Espinal, Pampa, Chaco'),
  arbol('TIM', 'Timbó', 'Enterolobium contortisiliquum', 'Chaco, Selva paranaense, Yungas'),
  arbol('TIP', 'Tipa', 'Tipuana tipu', 'Yungas'),

  // Yungas
  arbol('ALI', 'Aliso del cerro', 'Alnus acuminata', 'Yungas'),
  arbol('CDO', 'Cedro orán', 'Cedrela balansae', 'Yungas'),
  arbol('CDC', 'Cedro coya', 'Cedrela angustifolia', 'Yungas'),
  arbol('CEB', 'Cebil colorado', 'Anadenanthera colubrina', 'Yungas, Chaco'),
  arbol('CNV', 'Carnaval', 'Senna spectabilis', 'Yungas'),
  arbol('CSA', 'Ceibo salteño', 'Erythrina falcata', 'Yungas'),
  arbol('HCE', 'Horco cebil', 'Parapiptadenia excelsa', 'Yungas'),
  arbol('LAF', 'Laurel de la falda', 'Cinnamomum porphyrium', 'Yungas'),
  arbol('MAT', 'Mato', 'Myrcianthes pseudomato', 'Yungas'),
  arbol('NOG', 'Nogal criollo', 'Juglans australis', 'Yungas'),
  arbol('PAA', 'Palo amarillo', 'Phyllostylon rhamnoides', 'Yungas, Chaco'),
  arbol('PBL', 'Palo blanco', 'Calycophyllum multiflorum', 'Yungas, Chaco'),
  arbol('PCE', 'Pino del cerro', 'Podocarpus parlatorei', 'Yungas'),
  arbol('QUI', 'Quina', 'Myroxylon peruiferum', 'Yungas'),
  arbol('TCO', 'Tipa colorada', 'Pterogyne nitens', 'Yungas, Chaco'),
  arbol('URU', 'Urundel', 'Astronium urundeuva', 'Yungas, Chaco'),
  arbol('VIS', 'Viscote', 'Acacia visco', 'Yungas, Sierras'),

  // Selva paranaense (Misiones y alrededores)
  arbol('AGI', 'Aguaí', 'Chrysophyllum gonocarpum', 'Selva paranaense'),
  arbol('AMB', 'Ambay', 'Cecropia pachystachya', 'Selva paranaense'),
  arbol('CAN', 'Cancharana', 'Cabralea canjerana', 'Selva paranaense'),
  arbol('CER', 'Cerella', 'Eugenia involucrata', 'Selva paranaense'),
  arbol('CMI', 'Cedro misionero', 'Cedrela fissilis', 'Selva paranaense'),
  arbol('GBL', 'Guatambú blanco', 'Balfourodendron riedelianum', 'Selva paranaense'),
  arbol('GRA', 'Grapia', 'Apuleia leiocarpa', 'Selva paranaense'),
  arbol('GUB', 'Guabiyú', 'Myrcianthes pungens', 'Selva paranaense, Yungas'),
  arbol('GUY', 'Guayaibí', 'Cordia americana', 'Selva paranaense, Chaco'),
  arbol('IBP', 'Ibirá pitá (caña fístola)', 'Peltophorum dubium', 'Selva paranaense, Chaco'),
  arbol('INC', 'Incienso', 'Myrocarpus frondosus', 'Selva paranaense'),
  arbol('LAM', 'Lapacho amarillo', 'Handroanthus albus', 'Selva paranaense'),
  arbol('LBL', 'Loro blanco', 'Bastardiopsis densiflora', 'Selva paranaense'),
  arbol('LNE', 'Lapacho negro', 'Handroanthus heptaphyllus', 'Selva paranaense, Chaco'),
  arbol('MPR', 'María preta', 'Diatenopteryx sorbifolia', 'Selva paranaense'),
  arbol('PDB', 'Pata de buey', 'Bauhinia forficata', 'Selva paranaense, Delta y ribera'),
  arbol('PET', 'Peteribí', 'Cordia trichotoma', 'Selva paranaense'),
  palmera('PIN', 'Pindó', 'Syagrus romanzoffiana', 'Selva paranaense, Delta y ribera'),
  arbol('PPA', 'Pino Paraná', 'Araucaria angustifolia', 'Selva paranaense'),
  arbol('PRO', 'Palo rosa', 'Aspidosperma polyneuron', 'Selva paranaense'),
  arbol('SDR', 'Sangre de drago', 'Croton urucurana', 'Selva paranaense, Delta y ribera'),
  arbol('TEM', 'Tembetarí', 'Zanthoxylum rhoifolium', 'Selva paranaense'),
  arbol('UBA', 'Ubajay', 'Hexachlamys edulis', 'Selva paranaense, Delta y ribera'),
  arbol('YER', 'Yerba mate', 'Ilex paraguariensis', 'Selva paranaense'),
  arbol('YVA', 'Yvapurú', 'Plinia peruviana', 'Selva paranaense'),

  // Chaco
  arbol('BRE', 'Brea', 'Parkinsonia praecox', 'Chaco, Monte'),
  palmera('CAR', 'Caranday', 'Copernicia alba', 'Chaco'),
  arbol('CIN', 'Cina-cina', 'Parkinsonia aculeata', 'Chaco, Monte, Espinal'),
  arbol('GAR', 'Garabato', 'Senegalia praecox', 'Chaco'),
  arbol('GUA', 'Guayacán', 'Libidibia paraguariensis', 'Chaco'),
  arbol('GUR', 'Guaraniná', 'Sideroxylon obtusifolium', 'Chaco, Espinal'),
  arbol('ITI', 'Itín', 'Prosopis kuntzei', 'Chaco'),
  arbol('LAB', 'Lapacho blanco', 'Tabebuia roseoalba', 'Chaco, Yungas'),
  arbol('MIS', 'Mistol', 'Sarcomphalus mistol', 'Chaco'),
  arbol('PCR', 'Palo cruz', 'Tabebuia nodosa', 'Chaco'),
  arbol('PSA', 'Palo santo', 'Bulnesia sarmientoi', 'Chaco'),
  arbol('QCS', 'Quebracho colorado santiagueño', 'Schinopsis lorentzii', 'Chaco'),
  arbol('TUS', 'Tusca', 'Vachellia aroma', 'Chaco, Espinal'),
  arbol('VIN', 'Vinal', 'Prosopis ruscifolia', 'Chaco'),

  // Espinal, Pampa y Sierras
  arbol('AGU', 'Aguaribay', 'Schinus areira', 'Sierras, Monte, Chaco'),
  arbol('CAL', 'Caldén', 'Prosopis caldenia', 'Espinal'),
  arbol('COC', 'Coco', 'Zanthoxylum coco', 'Sierras, Chaco'),
  arbol('COE', 'Coentrillo', 'Zanthoxylum fagara', 'Espinal, Chaco, Delta y ribera'),
  arbol('MBE', 'Molle de beber', 'Lithraea molleoides', 'Sierras, Espinal'),
  arbol('MCA', 'Manzano del campo', 'Ruprechtia apetala', 'Sierras, Chaco'),
  arbol('MRD', 'Moradillo', 'Schinus fasciculatus', 'Espinal, Sierras'),
  arbol('NAN', 'Ñandubay', 'Prosopis affinis', 'Espinal'),
  arbol('OQU', 'Orco quebracho', 'Schinopsis marginata', 'Sierras'),
  arbol('PIQ', 'Piquillín', 'Condalia microphylla', 'Monte, Espinal'),
  arbol('SEN', 'Sen del campo', 'Senna corymbosa', 'Pampa, Espinal, Delta y ribera'),
  arbol('TAB', 'Tabaquillo', 'Polylepis australis', 'Sierras'),
  arbol('TIN', 'Tintitaco', 'Prosopis torquata', 'Chaco, Monte'),

  // Delta y ribera (Paraná, Uruguay y Río de la Plata)
  arbol('AZC', 'Azota caballo', 'Luehea divaricata', 'Delta y ribera, Selva paranaense'),
  arbol('BLA', 'Blanquillo', 'Sebastiania commersoniana', 'Delta y ribera'),
  arbol('CNL', 'Canelón', 'Myrsine laetevirens', 'Delta y ribera'),
  arbol('FBR', 'Fumo bravo', 'Solanum granulosoleprosum', 'Delta y ribera, Selva paranaense'),
  arbol('HIG', 'Higuerón', 'Ficus luschnathiana', 'Delta y ribera, Selva paranaense'),
  arbol('LCR', 'Laurel criollo', 'Ocotea acutifolia', 'Delta y ribera'),
  arbol('MTJ', 'Mataojo', 'Pouteria salicifolia', 'Delta y ribera'),
  arbol('OMB', 'Ombú', 'Phytolacca dioica', 'Pampa, Delta y ribera'),
  arbol('RMO', 'Rabo molle', 'Lonchocarpus nitidus', 'Delta y ribera, Espinal'),
  arbol('SAC', 'Sauco', 'Sambucus australis', 'Delta y ribera, Pampa'),
  arbol('SBL', 'Sarandí blanco', 'Phyllanthus sellowianus', 'Delta y ribera'),
  arbol('SCO', 'Sarandí colorado', 'Cephalanthus glabratus', 'Delta y ribera'),
  arbol('TRM', 'Tarumá', 'Citharexylum montevidense', 'Delta y ribera'),
  palmera('YAT', 'Palmera yatay', 'Butia yatay', 'Espinal, Delta y ribera'),

  // Monte (Cuyo y Patagonia norte)
  arbol('ALC', 'Algarrobo chileno', 'Prosopis chilensis', 'Monte'),
  arbol('ALD', 'Algarrobo dulce', 'Prosopis flexuosa', 'Monte'),
  arbol('ALP', 'Alpataco', 'Prosopis alpataco', 'Monte'),
  arbol('JAR', 'Jarilla', 'Larrea divaricata', 'Monte'),
  arbol('MNE', 'Monte negro', 'Bougainvillea spinosa', 'Monte'),
  arbol('RET', 'Retamo', 'Bulnesia retama', 'Monte'),
  arbol('ZAM', 'Zampa', 'Atriplex lampa', 'Monte'),

  // Bosque andino patagónico
  arbol('ALE', 'Alerce', 'Fitzroya cupressoides', 'Patagonia andina'),
  arbol('ARP', 'Arrayán patagónico', 'Luma apiculata', 'Patagonia andina'),
  arbol('AVE', 'Avellano', 'Gevuina avellana', 'Patagonia andina'),
  arbol('CGU', 'Ciprés de las Guaitecas', 'Pilgerodendron uviferum', 'Patagonia andina'),
  arbol('CIP', 'Ciprés de la cordillera', 'Austrocedrus chilensis', 'Patagonia andina'),
  arbol('CLF', 'Calafate', 'Berberis microphylla', 'Patagonia andina'),
  arbol('CNE', 'Canelo', 'Drimys winteri', 'Patagonia andina'),
  arbol('COI', 'Coihue', 'Nothofagus dombeyi', 'Patagonia andina'),
  arbol('GUI', 'Guindo', 'Nothofagus betuloides', 'Patagonia andina'),
  arbol('LAU', 'Laura', 'Schinus patagonicus', 'Patagonia andina'),
  arbol('LEN', 'Lenga', 'Nothofagus pumilio', 'Patagonia andina'),
  arbol('MAI', 'Maitén', 'Maytenus boaria', 'Patagonia andina'),
  arbol('MAN', 'Mañío macho', 'Podocarpus nubigenus', 'Patagonia andina'),
  arbol('MAQ', 'Maqui', 'Aristotelia chilensis', 'Patagonia andina'),
  arbol('NIR', 'Ñire', 'Nothofagus antarctica', 'Patagonia andina'),
  arbol('NOT', 'Notro', 'Embothrium coccineum', 'Patagonia andina'),
  arbol('PEH', 'Pehuén', 'Araucaria araucana', 'Patagonia andina'),
  arbol('RAD', 'Radal', 'Lomatia hirsuta', 'Patagonia andina'),
  arbol('RAU', 'Raulí', 'Nothofagus alpina', 'Patagonia andina'),
  arbol('RPE', 'Roble pellín', 'Nothofagus obliqua', 'Patagonia andina'),

  // Árboles exóticos (ornamentales y de arbolado). Los fresnos: en Argentina se documentan el fresno americano
  // (Fraxinus pennsylvanica, cultivado y naturalizado; Achinelli y Delucchi 1999 concluyeron que el "fresno
  // americano" del país es esta especie y no F. americana), el europeo (F. excelsior, también en su forma dorada
  // 'Aurea', muy plantada en Buenos Aires) y el de Arizona (F. velutina, que algunos autores tratan como
  // subespecie de F. pennsylvanica). No se agregaron otros fresnos (F. angustifolia, F. ornus, F. uhdei...) porque
  // no hay registros en Argentina.
  arbol('SLL', 'Sauce llorón', 'Salix babylonica', 'Exótica'),
  // "Fresno rojo" y "fresno verde" son otros nombres de esta misma especie (Fraxinus pennsylvanica).
  arbol('FRA', 'Fresno americano (fresno rojo)', 'Fraxinus pennsylvanica', 'Exótica'),
  arbol('FRZ', 'Fresno de Arizona', 'Fraxinus velutina', 'Exótica'),
  arbol('FRD', 'Fresno dorado', "Fraxinus excelsior 'Aurea'", 'Exótica'),
  arbol('FRE', 'Fresno europeo', 'Fraxinus excelsior', 'Exótica'),

  // Palmeras nativas (además de Pindó, Caranday y Palmera yatay, que están más arriba)
  palmera('BPA', 'Yatay poñí', 'Butia paraguayensis', 'Selva paranaense'),
  palmera('MBO', 'Mbocayá', 'Acrocomia aculeata', 'Selva paranaense, Chaco'),
  palmera('TCA', 'Caranday serrano', 'Trithrinax campestris', 'Sierras, Chaco'),
  palmera('TSC', 'Carandillo', 'Trithrinax schizophylla', 'Chaco'),

  // Palmeras exóticas. Las primeras cinco figuran en nativetrees.com.ar (Nuestras especies → Palmeras).
  palmera('BUN', 'Butiagrus', '× Butyagrus nabonnandii', 'Exótica'),
  palmera('PCA', 'Palmera canaria (fénix)', 'Phoenix canariensis', 'Exótica'),
  palmera('PDA', 'Palmera datilera', 'Phoenix dactylifera', 'Exótica'),
  palmera('WFI', 'Washingtonia', 'Washingtonia filifera', 'Exótica'),
  palmera('WRO', 'Washingtonia robusta', 'Washingtonia robusta', 'Exótica'),
  palmera('ARE', 'Areca', 'Dypsis lutescens', 'Exótica'),
  palmera('ARQ', 'Palmera real australiana', 'Archontophoenix cunninghamiana', 'Exótica'),
  palmera('BRA', 'Palmera azul', 'Brahea armata', 'Exótica'),
  palmera('CHU', 'Palmito europeo', 'Chamaerops humilis', 'Exótica'),
  palmera('KEN', 'Kentia', 'Howea forsteriana', 'Exótica'),
  palmera('LIV', 'Livistona', 'Livistona chinensis', 'Exótica'),
  palmera('PRB', 'Fénix enana', 'Phoenix roebelenii', 'Exótica'),
  palmera('TRF', 'Palmera de la China', 'Trachycarpus fortunei', 'Exótica'),
  // La cica no es una palmera, pero SENASA la incluye en el mismo grupo que las palmeras.
  palmera('CYC', 'Cica', 'Cycas revoluta', 'Exótica'),

  // Frutales
  frutal('OLI', 'Olivo', 'Olea europaea'),
  // Cítricos
  frutal('LIM', 'Limonero', 'Citrus limon'),
  frutal('NAR', 'Naranjo', 'Citrus sinensis'),
  frutal('NAM', 'Naranjo amargo', 'Citrus × aurantium'),
  frutal('MDR', 'Mandarino', 'Citrus reticulata'),
  frutal('POM', 'Pomelo', 'Citrus × paradisi'),
  frutal('LMA', 'Lima', 'Citrus aurantiifolia'),
  frutal('KUM', 'Kumquat', 'Citrus japonica'),
  // Carozo
  frutal('DUR', 'Durazno', 'Prunus persica'),
  frutal('PEL', 'Pelón (nectarina)', 'Prunus persica var. nucipersica'),
  frutal('CIR', 'Ciruelo', 'Prunus domestica'),
  frutal('DAM', 'Damasco', 'Prunus armeniaca'),
  frutal('CRZ', 'Cerezo', 'Prunus avium'),
  frutal('ALM', 'Almendro', 'Prunus dulcis'),
  // Pepita
  frutal('MZA', 'Manzano', 'Malus domestica'),
  frutal('PER', 'Peral', 'Pyrus communis'),
  frutal('MEM', 'Membrillo', 'Cydonia oblonga'),
  // Otros
  frutal('PLT', 'Palta', 'Persea americana'),
  frutal('BAN', 'Banano', 'Musa × paradisiaca'),
  frutal('VID', 'Vid', 'Vitis vinifera'),
  frutal('KIW', 'Kiwi', 'Actinidia deliciosa'),
  frutal('HGU', 'Higuera', 'Ficus carica'),
  frutal('GRN', 'Granado', 'Punica granatum'),
  frutal('NGE', 'Nogal europeo', 'Juglans regia'),
  frutal('PCN', 'Pecán', 'Carya illinoinensis'),
  frutal('CAQ', 'Caqui', 'Diospyros kaki'),
  frutal('NIS', 'Níspero', 'Eriobotrya japonica'),
  frutal('ARA', 'Arándano', 'Vaccinium corymbosum'),
];
