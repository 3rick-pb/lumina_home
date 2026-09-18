/**
 * Official Dropi Ecuador Bulk Orders Template Data
 */

export const DROPI_HEADERS = [
  "NOMBRES",
  "APELLIDOS",
  "DIRECCIÓN Y BARRIO",
  "DEPARTAMENTO",
  "CIUDAD",
  "TELÉFONO",
  "ID DE PRODUCTO",
  "CANTIDAD",
  "PRECIO TOTAL (SIN PUNTOS NI COMAS)",
  "CON RECAUDO",
  "NOTA",
  "EMAIL (OPCIONAL)",
  "ID DE VARIABLE (OPCIONAL)",
  "CODIGO POSTAL (OPCIONAL)",
  "TRANSPORTADORA (OPCIONAL)",
  "CEDULA (OPCIONAL)",
  "COLONIA (OBLIGATORIO SOLO PARA QUIKEN)",
  "SEGURO (SOLO APLICA PARA ENVIA)"
] as const;

export const DROPI_ECUADOR_REFERENCE = [
  [
    "DEPARTAMENTO / PROVINCIA",
    "CIUDAD / CANTÓN",
    "CAPITAL PROVINCIAL"
  ],
  [
    "AZUAY",
    "CUENCA",
    "SÍ"
  ],
  [
    "AZUAY",
    "CAMILO PONCE ENRÍQUEZ"
  ],
  [
    "AZUAY",
    "CHORDELEG"
  ],
  [
    "AZUAY",
    "EL PAN"
  ],
  [
    "AZUAY",
    "GIRÓN"
  ],
  [
    "AZUAY",
    "GUACHAPALA"
  ],
  [
    "AZUAY",
    "GUALACEO"
  ],
  [
    "AZUAY",
    "NABÓN"
  ],
  [
    "AZUAY",
    "OÑA"
  ],
  [
    "AZUAY",
    "PAUTE"
  ],
  [
    "AZUAY",
    "PUCARÁ"
  ],
  [
    "AZUAY",
    "SAN FERNANDO"
  ],
  [
    "AZUAY",
    "SANTA ISABEL"
  ],
  [
    "AZUAY",
    "SEVILLA DE ORO"
  ],
  [
    "AZUAY",
    "SÍGSIG"
  ],
  [
    "BOLÍVAR",
    "GUARANDA",
    "SÍ"
  ],
  [
    "BOLÍVAR",
    "CALUMA"
  ],
  [
    "BOLÍVAR",
    "CHILLANES"
  ],
  [
    "BOLÍVAR",
    "CHIMBO"
  ],
  [
    "BOLÍVAR",
    "ECHEANDÍA"
  ],
  [
    "BOLÍVAR",
    "LAS NAVES"
  ],
  [
    "BOLÍVAR",
    "SAN MIGUEL"
  ],
  [
    "CAÑAR",
    "AZOGUES",
    "SÍ"
  ],
  [
    "CAÑAR",
    "BIBLIÁN"
  ],
  [
    "CAÑAR",
    "CAÑAR"
  ],
  [
    "CAÑAR",
    "DÉLEG"
  ],
  [
    "CAÑAR",
    "EL TAMBO"
  ],
  [
    "CAÑAR",
    "LA TRONCAL"
  ],
  [
    "CAÑAR",
    "SUSCAL"
  ],
  [
    "CARCHI",
    "TULCÁN",
    "SÍ"
  ],
  [
    "CARCHI",
    "BOLÍVAR"
  ],
  [
    "CARCHI",
    "ESPEJO"
  ],
  [
    "CARCHI",
    "MIRA"
  ],
  [
    "CARCHI",
    "MONTÚFAR"
  ],
  [
    "CARCHI",
    "SAN PEDRO DE HUACA"
  ],
  [
    "CHIMBORAZO",
    "RIOBAMBA",
    "SÍ"
  ],
  [
    "CHIMBORAZO",
    "ALAUSÍ"
  ],
  [
    "CHIMBORAZO",
    "CHAMBO"
  ],
  [
    "CHIMBORAZO",
    "CHUNCHI"
  ],
  [
    "CHIMBORAZO",
    "COLTA"
  ],
  [
    "CHIMBORAZO",
    "CUMANDÁ"
  ],
  [
    "CHIMBORAZO",
    "GUANO"
  ],
  [
    "CHIMBORAZO",
    "GUAMOTE"
  ],
  [
    "CHIMBORAZO",
    "PALLATANGA"
  ],
  [
    "CHIMBORAZO",
    "PENIPE"
  ],
  [
    "COTOPAXI",
    "LATACUNGA",
    "SÍ"
  ],
  [
    "COTOPAXI",
    "LA MANÁ"
  ],
  [
    "COTOPAXI",
    "PANGUA"
  ],
  [
    "COTOPAXI",
    "PUJILÍ"
  ],
  [
    "COTOPAXI",
    "SALCEDO"
  ],
  [
    "COTOPAXI",
    "SAQUISILÍ"
  ],
  [
    "COTOPAXI",
    "SIGCHOS"
  ],
  [
    "EL ORO",
    "MACHALA",
    "SÍ"
  ],
  [
    "EL ORO",
    "ARENILLAS"
  ],
  [
    "EL ORO",
    "ATAHUALPA"
  ],
  [
    "EL ORO",
    "BALSAS"
  ],
  [
    "EL ORO",
    "CHILLA"
  ],
  [
    "EL ORO",
    "EL GUABO"
  ],
  [
    "EL ORO",
    "HUAQUILLAS"
  ],
  [
    "EL ORO",
    "LAS LAJAS"
  ],
  [
    "EL ORO",
    "MARCABELÍ"
  ],
  [
    "EL ORO",
    "PASAJE"
  ],
  [
    "EL ORO",
    "PIÑAS"
  ],
  [
    "EL ORO",
    "PORTOVELO"
  ],
  [
    "EL ORO",
    "SANTA ROSA"
  ],
  [
    "EL ORO",
    "ZARUMA"
  ],
  [
    "ESMERALDAS",
    "ESMERALDAS",
    "SÍ"
  ],
  [
    "ESMERALDAS",
    "ATACAMES"
  ],
  [
    "ESMERALDAS",
    "ELOY ALFARO"
  ],
  [
    "ESMERALDAS",
    "MUISNE"
  ],
  [
    "ESMERALDAS",
    "QUININDÉ"
  ],
  [
    "ESMERALDAS",
    "RIOVERDE"
  ],
  [
    "ESMERALDAS",
    "SAN LORENZO"
  ],
  [
    "GUAYAS",
    "GUAYAQUIL",
    "SÍ"
  ],
  [
    "GUAYAS",
    "ALFREDO BAQUERIZO MORENO"
  ],
  [
    "GUAYAS",
    "BALAO"
  ],
  [
    "GUAYAS",
    "BALZAR"
  ],
  [
    "GUAYAS",
    "COLIMES"
  ],
  [
    "GUAYAS",
    "CORONEL MARCELINO MARIDUEÑA"
  ],
  [
    "GUAYAS",
    "DAULE"
  ],
  [
    "GUAYAS",
    "DURÁN"
  ],
  [
    "GUAYAS",
    "EL EMPALME"
  ],
  [
    "GUAYAS",
    "EL TRIUNFO"
  ],
  [
    "GUAYAS",
    "GENERAL ANTONIO ELIZALDE"
  ],
  [
    "GUAYAS",
    "ISIDRO AYORA"
  ],
  [
    "GUAYAS",
    "LOMAS DE SARGENTILLO"
  ],
  [
    "GUAYAS",
    "MILAGRO"
  ],
  [
    "GUAYAS",
    "NARANJAL"
  ],
  [
    "GUAYAS",
    "NARANJITO"
  ],
  [
    "GUAYAS",
    "NOBOL"
  ],
  [
    "GUAYAS",
    "PALESTINA"
  ],
  [
    "GUAYAS",
    "PEDRO CARBO"
  ],
  [
    "GUAYAS",
    "PLAYAS"
  ],
  [
    "GUAYAS",
    "SALITRE"
  ],
  [
    "GUAYAS",
    "SAMBORONDÓN"
  ],
  [
    "GUAYAS",
    "SANTA LUCÍA"
  ],
  [
    "GUAYAS",
    "SIMÓN BOLÍVAR"
  ],
  [
    "GUAYAS",
    "YAGUACHI"
  ],
  [
    "IMBABURA",
    "IBARRA",
    "SÍ"
  ],
  [
    "IMBABURA",
    "ANTONIO ANTE"
  ],
  [
    "IMBABURA",
    "COTACACHI"
  ],
  [
    "IMBABURA",
    "OTAVALO"
  ],
  [
    "IMBABURA",
    "PIMAMPIRO"
  ],
  [
    "IMBABURA",
    "SAN MIGUEL DE URCUQUÍ"
  ],
  [
    "LOJA",
    "LOJA",
    "SÍ"
  ],
  [
    "LOJA",
    "CALVAS"
  ],
  [
    "LOJA",
    "CATAMAYO"
  ],
  [
    "LOJA",
    "CELICA"
  ],
  [
    "LOJA",
    "CHAGUARPAMBA"
  ],
  [
    "LOJA",
    "ESPÍNDOLA"
  ],
  [
    "LOJA",
    "GONZANAMÁ"
  ],
  [
    "LOJA",
    "MACARÁ"
  ],
  [
    "LOJA",
    "OLMEDO"
  ],
  [
    "LOJA",
    "PALTAS"
  ],
  [
    "LOJA",
    "PINDAL"
  ],
  [
    "LOJA",
    "PUYANGO"
  ],
  [
    "LOJA",
    "QUILANGA"
  ],
  [
    "LOJA",
    "SARAGURO"
  ],
  [
    "LOJA",
    "SOZORANGA"
  ],
  [
    "LOJA",
    "ZAPOTILLO"
  ],
  [
    "LOS RÍOS",
    "BABAHOYO",
    "SÍ"
  ],
  [
    "LOS RÍOS",
    "BABA"
  ],
  [
    "LOS RÍOS",
    "BUENA FE"
  ],
  [
    "LOS RÍOS",
    "MOCACHE"
  ],
  [
    "LOS RÍOS",
    "MONTALVO"
  ],
  [
    "LOS RÍOS",
    "PALENQUE"
  ],
  [
    "LOS RÍOS",
    "PUEBLOVIEJO"
  ],
  [
    "LOS RÍOS",
    "QUEVEDO"
  ],
  [
    "LOS RÍOS",
    "QUINSALOMA"
  ],
  [
    "LOS RÍOS",
    "URDANETA"
  ],
  [
    "LOS RÍOS",
    "VALENCIA"
  ],
  [
    "LOS RÍOS",
    "VENTANAS"
  ],
  [
    "LOS RÍOS",
    "VINCES"
  ],
  [
    "MANABÍ",
    "PORTOVIEJO",
    "SÍ"
  ],
  [
    "MANABÍ",
    "24 DE MAYO"
  ],
  [
    "MANABÍ",
    "BOLÍVAR"
  ],
  [
    "MANABÍ",
    "CHONE"
  ],
  [
    "MANABÍ",
    "EL CARMEN"
  ],
  [
    "MANABÍ",
    "FLAVIO ALFARO"
  ],
  [
    "MANABÍ",
    "JAMA"
  ],
  [
    "MANABÍ",
    "JARAMIJÓ"
  ],
  [
    "MANABÍ",
    "JIPIJAPA"
  ],
  [
    "MANABÍ",
    "JUNÍN"
  ],
  [
    "MANABÍ",
    "MANTA"
  ],
  [
    "MANABÍ",
    "MONTECRISTI"
  ],
  [
    "MANABÍ",
    "OLMEDO"
  ],
  [
    "MANABÍ",
    "PAJÁN"
  ],
  [
    "MANABÍ",
    "PEDERNALES"
  ],
  [
    "MANABÍ",
    "PICHINCHA"
  ],
  [
    "MANABÍ",
    "PUERTO LÓPEZ"
  ],
  [
    "MANABÍ",
    "ROCAFUERTE"
  ],
  [
    "MANABÍ",
    "SAN VICENTE"
  ],
  [
    "MANABÍ",
    "SANTA ANA"
  ],
  [
    "MANABÍ",
    "SUCRE"
  ],
  [
    "MANABÍ",
    "TOSAGUA"
  ],
  [
    "MORONA SANTIAGO",
    "MACAS",
    "SÍ"
  ],
  [
    "MORONA SANTIAGO",
    "GUALAQUIZA"
  ],
  [
    "MORONA SANTIAGO",
    "HUAMBOYA"
  ],
  [
    "MORONA SANTIAGO",
    "LIMÓN INDANZA"
  ],
  [
    "MORONA SANTIAGO",
    "LOGROÑO"
  ],
  [
    "MORONA SANTIAGO",
    "PALORA"
  ],
  [
    "MORONA SANTIAGO",
    "PABLO SEXTO"
  ],
  [
    "MORONA SANTIAGO",
    "SAN JUAN BOSCO"
  ],
  [
    "MORONA SANTIAGO",
    "SANTIAGO"
  ],
  [
    "MORONA SANTIAGO",
    "SUCÚA"
  ],
  [
    "MORONA SANTIAGO",
    "TAISHA"
  ],
  [
    "MORONA SANTIAGO",
    "TIWINTZA"
  ],
  [
    "NAPO",
    "TENA",
    "SÍ"
  ],
  [
    "NAPO",
    "ARCHIDONA"
  ],
  [
    "NAPO",
    "CARLOS JULIO AROSEMENA TOLA"
  ],
  [
    "NAPO",
    "EL CHACO"
  ],
  [
    "NAPO",
    "QUIJOS"
  ],
  [
    "PASTAZA",
    "PUYO",
    "SÍ"
  ],
  [
    "PASTAZA",
    "ARAJUNO"
  ],
  [
    "PASTAZA",
    "MERA"
  ],
  [
    "PASTAZA",
    "SANTA CLARA"
  ],
  [
    "PICHINCHA",
    "QUITO",
    "SÍ"
  ],
  [
    "PICHINCHA",
    "CAYAMBE"
  ],
  [
    "PICHINCHA",
    "MEJÍA"
  ],
  [
    "PICHINCHA",
    "PEDRO MONCAYO"
  ],
  [
    "PICHINCHA",
    "PEDRO VICENTE MALDONADO"
  ],
  [
    "PICHINCHA",
    "PUERTO QUITO"
  ],
  [
    "PICHINCHA",
    "RUMIÑAHUI"
  ],
  [
    "PICHINCHA",
    "SAN MIGUEL DE LOS BANCOS"
  ],
  [
    "TUNGURAHUA",
    "AMBATO",
    "SÍ"
  ],
  [
    "TUNGURAHUA",
    "BAÑOS DE AGUA SANTA"
  ],
  [
    "TUNGURAHUA",
    "CEVALLOS"
  ],
  [
    "TUNGURAHUA",
    "MOCHA"
  ],
  [
    "TUNGURAHUA",
    "PATATE"
  ],
  [
    "TUNGURAHUA",
    "QUERO"
  ],
  [
    "TUNGURAHUA",
    "SAN PEDRO DE PELILEO"
  ],
  [
    "TUNGURAHUA",
    "SANTIAGO DE PÍLLARO"
  ],
  [
    "TUNGURAHUA",
    "TISALEO"
  ],
  [
    "ZAMORA CHINCHIPE",
    "ZAMORA",
    "SÍ"
  ],
  [
    "ZAMORA CHINCHIPE",
    "CENTINELA DEL CÓNDOR"
  ],
  [
    "ZAMORA CHINCHIPE",
    "CHINCHIPE"
  ],
  [
    "ZAMORA CHINCHIPE",
    "EL PANGUI"
  ],
  [
    "ZAMORA CHINCHIPE",
    "NANGARITZA"
  ],
  [
    "ZAMORA CHINCHIPE",
    "PALANDA"
  ],
  [
    "ZAMORA CHINCHIPE",
    "PAQUISHA"
  ],
  [
    "ZAMORA CHINCHIPE",
    "YACUAMBI"
  ],
  [
    "ZAMORA CHINCHIPE",
    "YANTZAZA"
  ],
  [
    "GALÁPAGOS",
    "PUERTO BAQUERIZO MORENO",
    "SÍ"
  ],
  [
    "GALÁPAGOS",
    "ISABELA"
  ],
  [
    "GALÁPAGOS",
    "SANTA CRUZ"
  ],
  [
    "SUCUMBÍOS",
    "NUEVA LOJA",
    "SÍ"
  ],
  [
    "SUCUMBÍOS",
    "CASCALES"
  ],
  [
    "SUCUMBÍOS",
    "CUYABENO"
  ],
  [
    "SUCUMBÍOS",
    "GONZALO PIZARRO"
  ],
  [
    "SUCUMBÍOS",
    "LAGO AGRIO"
  ],
  [
    "SUCUMBÍOS",
    "PUTUMAYO"
  ],
  [
    "SUCUMBÍOS",
    "SHUSHUFINDI"
  ],
  [
    "SUCUMBÍOS",
    "SUCUMBÍOS"
  ],
  [
    "ORELLANA",
    "FRANCISCO DE ORELLANA",
    "SÍ"
  ],
  [
    "ORELLANA",
    "AGUARICO"
  ],
  [
    "ORELLANA",
    "LA JOYA DE LOS SACHAS"
  ],
  [
    "ORELLANA",
    "LORETO"
  ],
  [
    "SANTO DOMINGO DE LOS TSÁCHILAS",
    "SANTO DOMINGO",
    "SÍ"
  ],
  [
    "SANTO DOMINGO DE LOS TSÁCHILAS",
    "LA CONCORDIA"
  ],
  [
    "SANTA ELENA",
    "SANTA ELENA",
    "SÍ"
  ],
  [
    "SANTA ELENA",
    "LA LIBERTAD"
  ],
  [
    "SANTA ELENA",
    "SALINAS"
  ],
  [],
  [],
  [
    "GUÍA PARA PEDIDOS EN ECUADOR"
  ],
  [
    "DEPARTAMENTO / PROVINCIA = provincia del cliente (ej.: PICHINCHA)."
  ],
  [
    "CIUDAD / CANTÓN = ciudad o cantón del destino (ej.: QUITO)."
  ],
  [
    "DIRECCIÓN Y BARRIO = dirección física completa (ej.: Casa P4 19, calle, barrio, urbanización, etc.)."
  ]
];
